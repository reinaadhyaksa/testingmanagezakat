import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faCalendarAlt,
    faUser,
    faTags,
    faMoneyBillWave,
    faSave,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import { useNavigate, useParams } from 'react-router-dom'

const PengeluaranForm = ({ mode = 'tambah' }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        penerima: '',
        kategori: '',
        jumlah: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [kategoriSuggestions, setKategoriSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    const navigate = useNavigate()
    const { id } = useParams()

    // List kategori pengeluaran yang sudah ada (untuk suggestions)
    const existingKategori = [
        'Fakir Miskin',
        'Anak Yatim',
        'Fisabilillah',
        'Mualaf',
        'Amil',
        'Ibnu Sabil',
        'Gharimin',
        'Bantuan Pendidikan',
        'Bantuan Kesehatan',
        'Operasional'
    ]

    // Load data untuk edit mode
    useEffect(() => {
        if (mode === 'edit' && id) {
            fetchData()
        }
    }, [mode, id])

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
                // Format date untuk input (YYYY-MM-DD)
                const dateParts = data.date.split('/')
                const formattedDate = dateParts.length === 3
                    ? `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
                    : new Date().toISOString().split('T')[0]

                setFormData({
                    date: formattedDate,
                    penerima: data.penerima,
                    kategori: data.kategori,
                    jumlah: data.jumlah.toString()
                })
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Format kategori name - kapitalisasi setiap kata
    const formatKategoriName = (input) => {
        if (!input) return ''

        // Kapitalisasi setiap kata
        return input
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    // Handle input change untuk kategori
    const handleKategoriChange = (e) => {
        const value = e.target.value
        const formattedValue = formatKategoriName(value)

        setFormData(prev => ({
            ...prev,
            kategori: formattedValue
        }))

        // Filter suggestions berdasarkan input
        if (value.length > 0) {
            const filtered = existingKategori.filter(kategori =>
                kategori.toLowerCase().includes(value.toLowerCase())
            )
            setKategoriSuggestions(filtered)
            setShowSuggestions(true)
        } else {
            setKategoriSuggestions([])
            setShowSuggestions(false)
        }
    }

    // Handle input change untuk field lainnya
    const handleInputChange = (e) => {
        const { name, value } = e.target

        if (name === 'jumlah') {
            const numericValue = value.replace(/[^\d]/g, '')
            setFormData(prev => ({
                ...prev,
                [name]: numericValue
            }))
        } else if (name !== 'kategori') {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        setFormData(prev => ({
            ...prev,
            kategori: suggestion
        }))
        setShowSuggestions(false)
        setKategoriSuggestions([])
    }

    // Handle blur untuk hide suggestions
    const handleKategoriBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false)
        }, 200)
    }

    // Handle focus untuk show suggestions jika ada input
    const handleKategoriFocus = () => {
        if (formData.kategori.length > 0) {
            const filtered = existingKategori.filter(kategori =>
                kategori.toLowerCase().includes(formData.kategori.toLowerCase())
            )
            setKategoriSuggestions(filtered)
            setShowSuggestions(true)
        }
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setSubmitting(true)
            setError(null)

            // Validasi form
            if (!formData.date || !formData.penerima || !formData.kategori || !formData.jumlah) {
                throw new Error('Semua field harus diisi!')
            }

            const jumlahNumber = parseFloat(formData.jumlah)

            const newData = {
                date: new Date(formData.date).toLocaleDateString('id-ID'),
                penerima: formData.penerima,
                kategori: formData.kategori,
                jumlah: jumlahNumber
            }

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

            // Redirect kembali ke halaman utama
            navigate('/pengeluaran')

            alert(mode === 'edit' ? 'Data berhasil diupdate!' : 'Data berhasil ditambahkan!')

        } catch (error) {
            console.error('Error saving data:', error)
            setError(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    // Handle back navigation
    const handleBack = () => {
        navigate('/pengeluaran')
    }

    if (loading) {
        return (
            <section className="mb-12">
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            </section>
        )
    }

    return (
        <section className="mb-12">
            {/* Header */}
            <div className="flex items-center mb-4 sm:mb-6">
                <button
                    onClick={handleBack}
                    className="mr-3 sm:mr-4 text-slate-600 hover:text-slate-800 transition-colors duration-200 p-2 rounded-lg hover:bg-slate-100"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
                    {mode === 'edit' ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
                </h2>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-green-50 max-w-2xl mx-auto">
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
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-sm sm:text-base"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">
                            <FontAwesomeIcon icon={faUser} className="mr-2 text-green-600 text-sm sm:text-base" />
                            Nama Penerima
                        </label>
                        <input
                            type="text"
                            name="penerima"
                            value={formData.penerima}
                            onChange={handleInputChange}
                            placeholder="Masukkan nama penerima"
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-sm sm:text-base"
                            required
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm sm:text-base font-medium text-slate-700 mb-2">
                            <FontAwesomeIcon icon={faTags} className="mr-2 text-green-600 text-sm sm:text-base" />
                            Kategori Penyaluran
                        </label>
                        <input
                            type="text"
                            name="kategori"
                            value={formData.kategori}
                            onChange={handleKategoriChange}
                            onBlur={handleKategoriBlur}
                            onFocus={handleKategoriFocus}
                            placeholder="Ketik kategori, contoh: fakir miskin"
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-sm sm:text-base"
                            required
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && kategoriSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-green-200 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                                {kategoriSuggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b border-green-100 last:border-b-0 text-sm sm:text-base"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Info text */}
                        <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                            Ketik kategori. Akan otomatis dikapitalisasi. Contoh: ketik "fakir miskin" akan menjadi "Fakir Miskin"
                        </p>
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
                                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-sm sm:text-base"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                            Contoh: 100000
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex-1 px-4 py-3 border border-green-300 text-slate-700 rounded-lg hover:bg-green-50 transition-colors duration-200 flex items-center justify-center font-medium text-sm sm:text-base"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                            Kembali
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm text-sm sm:text-base"
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

            {/* Informasi Tambahan */}
            <div className="max-w-2xl mx-auto mt-4 sm:mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0 text-xs sm:text-sm" />
                        <div>
                            <p className="text-blue-800 font-medium text-xs sm:text-sm mb-1">Informasi Penting</p>
                            <p className="text-blue-700 text-xs sm:text-sm">
                                Pastikan semua data yang dimasukkan sudah benar. Data yang sudah disimpan tidak dapat diubah kecuali melalui proses edit.
                                Untuk kategori, cukup ketik nama kategorinya saja (contoh: "fakir miskin"), sistem akan otomatis mengkapitalisasi huruf pertama setiap kata.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PengeluaranForm