import { useState, useEffect } from 'react'
import { supabase } from '../../../utils/supabase'

const MuzakkiTab = () => {
    const [muzakki, setMuzakki] = useState([])
    const [dusun, setDusun] = useState([])
    const [loading, setLoading] = useState(false)
    const [nomorRegistrasi, setNomorRegistrasi] = useState('')
    const [nama, setNama] = useState('')
    const [dusunId, setDusunId] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    const fetchMuzakki = async () => {
        try {
            const { data, error } = await supabase
                .from('muzakki')
                .select(`
                    *,
                    dusun (
                        id,
                        nama
                    )
                `)
                .order('nomor_registrasi')

            if (error) throw error
            setMuzakki(data || [])
        } catch (error) {
            console.error('Error fetching muzakki:', error)
            alert('Gagal memuat data muzakki')
        }
    }

    const fetchDusun = async () => {
        try {
            const { data, error } = await supabase
                .from('dusun')
                .select('*')
                .order('nama')
            if (error) throw error
            setDusun(data || [])
        } catch (error) {
            console.error('Error fetching dusun:', error)
            alert('Gagal memuat data dusun')
        }
    }

    const getNextNomorRegistrasi = async () => {
        try {
            // Get the highest nomor_registrasi from database
            const { data, error } = await supabase
                .from('muzakki')
                .select('nomor_registrasi')
                .order('nomor_registrasi', { ascending: false })
                .limit(1)

            if (error) throw error

            if (data && data.length > 0) {
                // Convert to number, increment, and format back to 5 digits
                const lastNumber = parseInt(data[0].nomor_registrasi)
                const nextNumber = lastNumber + 1
                return nextNumber.toString().padStart(5, '0')
            } else {
                // If no data exists, start from 00001
                return '00001'
            }
        } catch (error) {
            console.error('Error getting next nomor registrasi:', error)
            throw error
        }
    }

    useEffect(() => {
        fetchMuzakki()
        fetchDusun()
    }, [])

    // Auto-generate nomor registrasi when component mounts or when adding new data
    useEffect(() => {
        if (!editingId) {
            generateAutoNomor()
        }
    }, [editingId])

    const generateAutoNomor = async () => {
        setIsGenerating(true)
        try {
            const nextNomor = await getNextNomorRegistrasi()
            setNomorRegistrasi(nextNomor)
        } catch (error) {
            console.error('Error generating nomor:', error)
            alert('Gagal generate nomor registrasi')
            // Fallback to manual input
            setNomorRegistrasi('')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!nomorRegistrasi.trim() || !nama.trim() || !dusunId) {
            alert('Semua field harus diisi')
            return
        }

        // Validasi nomor registrasi harus 5 digit
        if (!/^\d{5}$/.test(nomorRegistrasi)) {
            alert('Nomor registrasi harus 5 digit angka')
            return
        }

        setLoading(true)
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('muzakki')
                    .update({
                        nomor_registrasi: nomorRegistrasi,
                        nama: nama,
                        dusun_id: dusunId
                    })
                    .eq('id', editingId)
                if (error) throw error
                alert('Data muzakki berhasil diupdate')
            } else {
                // Check if nomor registrasi already exists
                const { data: existingData, error: checkError } = await supabase
                    .from('muzakki')
                    .select('id')
                    .eq('nomor_registrasi', nomorRegistrasi)
                    .single()

                if (existingData) {
                    alert('Nomor registrasi sudah digunakan. Sistem akan generate nomor baru.')
                    await generateAutoNomor()
                    return
                }

                const { error } = await supabase
                    .from('muzakki')
                    .insert([{
                        nomor_registrasi: nomorRegistrasi,
                        nama: nama,
                        dusun_id: dusunId
                    }])
                if (error) throw error
                alert('Data muzakki berhasil ditambahkan')
            }

            fetchMuzakki()
            resetForm()
        } catch (error) {
            console.error('Error saving data:', error)
            alert('Gagal menyimpan data: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (item) => {
        setNomorRegistrasi(item.nomor_registrasi)
        setNama(item.nama)
        setDusunId(item.dusun_id)
        setEditingId(item.id)
    }

    const handleDelete = async (id, nomorRegistrasi) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus data muzakki dengan nomor registrasi ${nomorRegistrasi}?`)) return

        try {
            const { error } = await supabase
                .from('muzakki')
                .delete()
                .eq('id', id)
            if (error) throw error
            alert('Data muzakki berhasil dihapus')
            fetchMuzakki()

            // Jika yang dihapus adalah data terakhir, reset form untuk generate nomor baru
            if (!editingId) {
                generateAutoNomor()
            }
        } catch (error) {
            console.error('Error deleting data:', error)
            alert('Gagal menghapus data')
        }
    }

    const cancelEdit = () => {
        resetForm()
    }

    const resetForm = () => {
        setNama('')
        setDusunId('')
        setEditingId(null)
        generateAutoNomor()
    }

    // Filter muzakki berdasarkan pencarian
    const filteredMuzakki = muzakki.filter(item =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomor_registrasi.includes(searchTerm) ||
        item.dusun.nama.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">
                    {editingId ? 'Edit' : 'Tambah'} Data Muzakki
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3 sm:mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nomor Registrasi *
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={nomorRegistrasi}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                                    setNomorRegistrasi(value)
                                }}
                                className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base font-mono transition-colors duration-200"
                                placeholder={isGenerating ? "Generating..." : "00001"}
                                maxLength={5}
                                required
                                disabled={isGenerating || !editingId}
                            />
                            {!editingId && (
                                <button
                                    type="button"
                                    onClick={generateAutoNomor}
                                    disabled={isGenerating}
                                    className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-xs sm:text-sm whitespace-nowrap transition-colors duration-200"
                                >
                                    {isGenerating ? '...' : 'Refresh'}
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {editingId
                                ? 'Nomor registrasi dapat diubah saat edit'
                                : isGenerating
                                    ? 'Sedang generate nomor...'
                                    : 'Nomor akan terisi otomatis secara berurutan'
                            }
                        </p>
                    </div>

                    <div className="mb-3 sm:mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nama Muzakki *
                        </label>
                        <input
                            type="text"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors duration-200"
                            placeholder="Masukkan nama lengkap muzakki"
                            required
                        />
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Dusun *
                        </label>
                        <div className="space-y-2">
                            {dusun.length === 0 ? (
                                <p className="text-slate-500 text-sm">Loading data dusun...</p>
                            ) : (
                                dusun.map((item) => (
                                    <div key={item.id} className="flex items-center">
                                        <input
                                            type="radio"
                                            id={`dusun-${item.id}`}
                                            name="dusun"
                                            value={item.id}
                                            checked={dusunId === item.id}
                                            onChange={(e) => setDusunId(e.target.value)}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-green-300"
                                            required
                                        />
                                        <label
                                            htmlFor={`dusun-${item.id}`}
                                            className="ml-2 block text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition-colors duration-200"
                                        >
                                            {item.nama}
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                        {!dusunId && (
                            <p className="text-xs text-red-500 mt-2">Pilih salah satu dusun</p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                            type="submit"
                            disabled={loading || isGenerating}
                            className="bg-green-700 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-50 text-sm sm:text-base transition-colors duration-200 font-medium"
                        >
                            {loading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-slate-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 text-sm sm:text-base transition-colors duration-200"
                            >
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-0">
                        Daftar Muzakki
                    </h2>
                    <div className="w-full sm:w-48">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors duration-200"
                            placeholder="Cari muzakki..."
                        />
                    </div>
                </div>

                <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                    {filteredMuzakki.length === 0 ? (
                        <p className="text-slate-500 text-center py-3 sm:py-4 text-sm sm:text-base">
                            {searchTerm ? 'Tidak ditemukan data muzakki' : 'Belum ada data muzakki'}
                        </p>
                    ) : (
                        filteredMuzakki.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-2 sm:p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors duration-200"
                            >
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-800 text-sm sm:text-base">
                                                {item.nama}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                No. Reg: <span className="font-mono font-semibold text-green-700">{item.nomor_registrasi}</span> | Dusun: {item.dusun.nama}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-1 sm:space-x-2 ml-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="text-green-700 hover:text-green-900 hover:bg-green-100 text-xs sm:text-sm font-medium px-2 py-1 rounded transition-colors duration-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, item.nomor_registrasi)}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-100 text-xs sm:text-sm font-medium px-2 py-1 rounded transition-colors duration-200"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {muzakki.length > 0 && (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs sm:text-sm text-slate-600 text-center">
                            Total {filteredMuzakki.length} dari {muzakki.length} data muzakki
                            {muzakki.length > 0 && (
                                <span className="block text-xs text-slate-500 mt-1">
                                    Nomor registrasi terakhir: <span className="font-mono font-semibold text-green-700">{muzakki[muzakki.length - 1].nomor_registrasi}</span>
                                </span>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MuzakkiTab