import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faCalendarAlt, faUser, faMoneyBillWave, faSave, faExclamationTriangle, faCamera, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons'
import { useNavigate, useParams } from 'react-router-dom'
import { CLOUDINARY_NAME, CLOUDINARY_PRESET } from '../../utils/data'
import { Loading } from '../Loading'

const PengeluaranForm = ({ mode = 'tambah' }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        mustahiq_id: '',
        jumlah: '',
        dokumentasi: null
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [mustahiqList, setMustahiqList] = useState([])
    const [uploadingImage, setUploadingImage] = useState(false)
    const [imagePreview, setImagePreview] = useState('')

    const navigate = useNavigate()
    const { id } = useParams()

    useEffect(() => {
        fetchMustahiqList()
        if (mode === 'edit' && id) {
            fetchData()
        }
    }, [mode, id])

    const fetchMustahiqList = async () => {
        try {
            const { data, error } = await supabase
                .from('mustahiq')
                .select(`
                    *,
                    dusun (
                        id,
                        nama
                    ),
                    kategori_penerima (
                        id,
                        nama
                    )
                `)
                .order('nama')

            if (error) throw error

            setMustahiqList(data || [])
        } catch (error) {
            console.error('Error fetching mustahiq list:', error)
        }
    }

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('pengeluaranomcar')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error

            if (data) {
                const dateParts = data.date.split('/')
                const formattedDate = dateParts.length === 3
                    ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
                    : new Date().toISOString().split('T')[0]

                setFormData({
                    date: formattedDate,
                    mustahiq_id: data.mustahiq_id || '',
                    jumlah: data.jumlah.toString(),
                    dokumentasi: data.dokumentasi
                })

                if (data.dokumentasi && data.dokumentasi.gambar_url) {
                    setImagePreview(data.dokumentasi.gambar_url)
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target

        if (name === 'jumlah') {
            const numericValue = value.replace(/[^\d]/g, '')
            setFormData(prev => ({
                ...prev,
                [name]: numericValue
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const handleMustahiqChange = (mustahiqId) => {
        setFormData(prev => ({
            ...prev,
            mustahiq_id: mustahiqId
        }))
    }

    const handleImageUpload = async (file) => {
        try {
            setUploadingImage(true)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', CLOUDINARY_PRESET)
            formData.append('cloud_name', CLOUDINARY_NAME)

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            )

            const data = await response.json()
            if (data.secure_url) {
                return data.secure_url
            } else {
                throw new Error('Upload gambar gagal')
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            throw error
        } finally {
            setUploadingImage(false)
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Hanya file gambar yang diizinkan')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file maksimal 5MB')
            return
        }

        try {
            const imageUrl = await handleImageUpload(file)

            setFormData(prev => ({
                ...prev,
                dokumentasi: {
                    gambar_url: imageUrl,
                    deskripsi: prev.dokumentasi?.deskripsi || '',
                    created_at: new Date().toISOString()
                }
            }))

            setImagePreview(URL.createObjectURL(file))

        } catch (error) {
            console.error('Error handling file:', error)
            alert('Error upload gambar: ' + error.message)
        }
    }

    const handleDokumentasiDeskripsiChange = (e) => {
        const deskripsi = e.target.value
        setFormData(prev => ({
            ...prev,
            dokumentasi: prev.dokumentasi ? {
                ...prev.dokumentasi,
                deskripsi: deskripsi
            } : {
                gambar_url: '',
                deskripsi: deskripsi,
                created_at: new Date().toISOString()
            }
        }))
    }

    const removeDokumentasi = () => {
        setFormData(prev => ({
            ...prev,
            dokumentasi: null
        }))
        setImagePreview('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setSubmitting(true)
            setError(null)

            if (!formData.date || !formData.mustahiq_id || !formData.jumlah) {
                throw new Error('Semua field harus diisi!')
            }

            // Get mustahiq data for the selected ID
            const selectedMustahiq = mustahiqList.find(m => m.id === formData.mustahiq_id)
            if (!selectedMustahiq) {
                throw new Error('Data mustahiq tidak valid!')
            }

            const jumlahNumber = parseFloat(formData.jumlah)

            const newData = {
                date: new Date(formData.date).toLocaleDateString('id-ID'),
                mustahiq_id: formData.mustahiq_id,
                mustahiq_nama: selectedMustahiq.nama,
                mustahiq_nomor_registrasi: selectedMustahiq.nomor_registrasi,
                mustahiq_dusun: selectedMustahiq.dusun.nama,
                mustahiq_kategori: selectedMustahiq.kategori_penerima.nama,
                jumlah: jumlahNumber,
                dokumentasi: formData.dokumentasi
            }

            console.log('Data yang akan disimpan:', newData)

            let result
            if (mode === 'edit') {
                result = await supabase
                    .from('pengeluaranomcar')
                    .update(newData)
                    .eq('id', id)
                    .select()
            } else {
                result = await supabase
                    .from('pengeluaranomcar')
                    .insert([newData])
                    .select()
            }

            if (result.error) throw result.error

            console.log('Data berhasil disimpan:', result.data)

            navigate('/pengeluaran')

            alert(mode === 'edit' ? 'Data berhasil diupdate!' : 'Data berhasil ditambahkan!')

        } catch (error) {
            console.error('Error saving data:', error)
            setError(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleBack = () => {
        navigate('/pengeluaran')
    }

    // Get selected mustahiq data for display
    const selectedMustahiq = mustahiqList.find(m => m.id === formData.mustahiq_id)

    if (loading) {
        return (
            <Loading />
        )
    }

    return (
        <section className="mb-12 mx-4 sm:mx-6 lg:mx-8">
            <div className="flex items-center mb-4 sm:mb-6">
                <button
                    onClick={handleBack}
                    className="mr-2 sm:mr-3 lg:mr-4 text-slate-600 hover:text-slate-800 transition-colors duration-200 p-2 rounded-lg hover:bg-green-50"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800">
                    {mode === 'edit' ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
                </h2>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 border border-green-200 max-w-2xl mx-auto">
                {error && (
                    <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2 text-xs sm:text-sm" />
                            <p className="text-red-800 text-xs sm:text-sm">{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-600 text-sm sm:text-base" />
                            Tanggal
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-sm sm:text-base"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-medium text-slate-700 mb-3">
                            <FontAwesomeIcon icon={faUser} className="mr-2 text-green-600 text-sm sm:text-base" />
                            Pilih Mustahiq (Penerima) *
                        </label>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {mustahiqList.length === 0 ? (
                                <p className="text-slate-500 text-xs sm:text-sm py-2">
                                    Belum ada mustahiq. Silakan tambah mustahiq di halaman Pengaturan terlebih dahulu.
                                </p>
                            ) : (
                                mustahiqList.map((mustahiq) => (
                                    <label key={mustahiq.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border border-green-300 rounded-lg hover:bg-green-50 cursor-pointer transition-colors duration-200">
                                        <input
                                            type="radio"
                                            name="mustahiq"
                                            value={mustahiq.id}
                                            checked={formData.mustahiq_id === mustahiq.id}
                                            onChange={() => handleMustahiqChange(mustahiq.id)}
                                            className="text-green-600 focus:ring-green-500 w-3 h-3 sm:w-4 sm:h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-800 text-sm sm:text-base">
                                                {mustahiq.nama}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                No. Reg: <span className="font-mono">{mustahiq.nomor_registrasi}</span> |
                                                Dusun: {mustahiq.dusun.nama} |
                                                Kategori: {mustahiq.kategori_penerima.nama}
                                            </div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        {!formData.mustahiq_id && mustahiqList.length > 0 && (
                            <p className="text-red-500 text-xs mt-2">Pilih salah satu mustahiq</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-green-600 text-sm sm:text-base" />
                            Jumlah
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="jumlah"
                                value={formData.jumlah ? new Intl.NumberFormat('id-ID').format(parseFloat(formData.jumlah)) : ''}
                                onChange={handleInputChange}
                                placeholder="Masukkan jumlah"
                                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-sm sm:text-base"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                            Contoh: 100000
                        </p>
                    </div>

                    <div className="border-t border-green-200 pt-4 sm:pt-6">
                        <label className="block text-sm sm:text-base font-medium text-slate-700 mb-3 sm:mb-4">
                            <FontAwesomeIcon icon={faCamera} className="mr-2 text-green-600 text-sm sm:text-base" />
                            Dokumentasi (Opsional)
                        </label>

                        <div className="mb-3 sm:mb-4">
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                                Upload Gambar
                            </label>

                            {imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Preview dokumentasi"
                                        className="w-full h-32 sm:h-48 object-cover rounded-lg border border-green-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeDokumentasi}
                                        className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-500 text-white p-1 sm:p-2 rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="w-2 h-2 sm:w-3 sm:h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-green-300 rounded-lg p-4 sm:p-6 text-center hover:border-green-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="dokumentasi-upload"
                                        disabled={uploadingImage}
                                    />
                                    <label
                                        htmlFor="dokumentasi-upload"
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        {uploadingImage ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-green-600 mb-2"></div>
                                                <p className="text-slate-600 text-xs sm:text-sm">Mengupload...</p>
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faPlus} className="text-green-400 text-xl sm:text-2xl mb-2" />
                                                <p className="text-slate-600 text-xs sm:text-sm">
                                                    Klik untuk upload gambar dokumentasi
                                                </p>
                                                <p className="text-slate-500 text-xs mt-1">
                                                    Format: JPG, PNG, GIF (max 5MB)
                                                </p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                                Deskripsi Dokumentasi
                            </label>
                            <textarea
                                value={formData.dokumentasi?.deskripsi || ''}
                                onChange={handleDokumentasiDeskripsiChange}
                                placeholder="Masukkan deskripsi untuk dokumentasi ini (contoh: bukti penyerahan, foto kegiatan, dll)..."
                                rows="3"
                                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-xs sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4 pt-3 sm:pt-4 lg:pt-6">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-green-300 text-slate-700 rounded-lg hover:bg-green-50 transition-colors duration-200 flex items-center justify-center font-medium text-xs sm:text-sm lg:text-base"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                            Kembali
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !formData.mustahiq_id}
                            className="flex-1 bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm text-xs sm:text-sm lg:text-base"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                                    {mode === 'edit' ? 'Mengupdate...' : 'Menyimpan...'}
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                                    {mode === 'edit' ? 'Update Data' : 'Simpan Data'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="max-w-2xl mx-auto mt-3 sm:mt-4 lg:mt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-green-600 mr-2 mt-0.5 flex-shrink-0 text-xs sm:text-sm" />
                        <div>
                            <p className="text-green-800 font-medium text-xs sm:text-sm mb-1">Informasi Penting</p>
                            <p className="text-green-700 text-xs sm:text-sm">
                                Pastikan semua data yang dimasukkan sudah benar. Data yang sudah disimpan tidak dapat diubah kecuali melalui proses edit.
                                Dokumentasi bersifat opsional dan dapat digunakan untuk bukti fisik penyaluran dana.
                                Pilih mustahiq dari daftar yang sudah terdaftar di sistem.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PengeluaranForm