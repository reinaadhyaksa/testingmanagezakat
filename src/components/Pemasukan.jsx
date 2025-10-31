import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSync,
    faPlus,
    faEdit,
    faTrash,
    faExclamationTriangle,
    faRefresh
} from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

const Pemasukan = () => {
    const [pemasukanData, setPemasukanData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    const navigate = useNavigate()

    // Fungsi untuk mengambil data pemasukan
    const fetchPemasukan = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('pemasukanomcar')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setPemasukanData(data || [])
            setError(null)
        } catch (error) {
            console.error('Error fetching data:', error)
            setError(error.message)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // Fungsi untuk refresh data manual
    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchPemasukan()
    }

    // Fungsi untuk navigasi ke halaman tambah data
    const handleTambahPemasukan = () => {
        navigate('/pemasukan/tambah')
    }

    // Fungsi untuk navigasi ke halaman edit data
    const handleEditPemasukan = (id) => {
        navigate(`/pemasukan/edit/${id}`)
    }

    // Fungsi untuk menghapus data
    const handleHapusPemasukan = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            return
        }

        try {
            setDeletingId(id)
            setError(null)

            const { error } = await supabase
                .from('pemasukanomcar')
                .delete()
                .eq('id', id)

            if (error) throw error

            console.log('Data berhasil dihapus')

        } catch (error) {
            console.error('Error deleting data:', error)
            setError(error.message)
            alert(`Error: ${error.message}`)
        } finally {
            setDeletingId(null)
        }
    }

    // Setup realtime subscription
    useEffect(() => {
        fetchPemasukan()

        const subscription = supabase
            .channel('pemasukanomcar-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pemasukanomcar'
                },
                (payload) => {
                    console.log('Realtime change received:', payload)

                    if (payload.eventType === 'INSERT') {
                        setPemasukanData(prev => [payload.new, ...prev])
                    } else if (payload.eventType === 'UPDATE') {
                        setPemasukanData(prev =>
                            prev.map(item =>
                                item.id === payload.new.id ? payload.new : item
                            )
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setPemasukanData(prev =>
                            prev.filter(item => item.id !== payload.old.id)
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    // Format currency untuk display
    const formatCurrency = (amount) => {
        const numericAmount = typeof amount === 'string'
            ? parseFloat(amount.replace(/[^\d]/g, ''))
            : amount

        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(numericAmount)
    }

    // Komponen UI
    if (loading && pemasukanData.length === 0) {
        return (
            <section className="mb-12">
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            </section>
        )
    }

    if (error && pemasukanData.length === 0) {
        return (
            <section className="mb-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                    <div className="flex items-center mb-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2 text-sm sm:text-base" />
                        <p className="text-red-800 font-medium text-sm sm:text-base">Error Loading Data</p>
                    </div>
                    <p className="text-red-700 text-xs sm:text-sm mb-3">{error}</p>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                            onClick={fetchPemasukan}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors duration-200"
                        >
                            <FontAwesomeIcon icon={faRefresh} className="h-4 w-4 mr-2" />
                            Refresh Data
                        </button>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="mb-12">
            {/* Main Content */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Manajemen Pemasukan</h2>
                <div className="flex items-center space-x-3 sm:space-x-4">
                    {loading && (
                        <div className="flex items-center text-slate-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                            <span className="text-xs sm:text-sm">Updating...</span>
                        </div>
                    )}
                    {/* Tombol Refresh */}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm text-sm sm:text-base"
                    >
                        {refreshing ? (
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                        ) : (
                            <FontAwesomeIcon icon={faSync} className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        <span className="font-medium">
                            {refreshing ? 'Memperbarui...' : 'Update Data'}
                        </span>
                    </button>
                    <button
                        onClick={handleTambahPemasukan}
                        className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center transition-colors duration-200 shadow-sm font-medium text-sm sm:text-base"
                    >
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        Tambah Pemasukan
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-green-50">
                {pemasukanData.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-slate-500 text-sm sm:text-base mb-4">Belum ada data pemasukan</p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                                onClick={handleRefresh}
                                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center text-sm transition-colors duration-200"
                            >
                                <FontAwesomeIcon icon={faRefresh} className="h-4 w-4 mr-2" />
                                Refresh Data
                            </button>
                            <button
                                onClick={handleTambahPemasukan}
                                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 font-medium"
                            >
                                Tambah Data Pertama
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-green-100">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Dusun</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Muzaki</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Jenis</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Jumlah</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-green-100">
                                {pemasukanData.map((item, index) => (
                                    <tr key={item.id || index} className="hover:bg-green-50 transition-colors duration-200">
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {item.date}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {item.dusun}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {item.muzaki}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${item.jenis === 'Zakat Fitrah' ? 'bg-green-100 text-green-800 border-green-200' :
                                                item.jenis === 'Zakat Maal' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                    item.jenis === 'Infaq' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                                                        'bg-lime-100 text-lime-800 border-lime-200'
                                                }`}>
                                                {item.jenis}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-800">
                                            {formatCurrency(item.jumlah)}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                                            <div className="flex space-x-1 sm:space-x-2">
                                                <button
                                                    onClick={() => handleEditPemasukan(item.id)}
                                                    className="text-green-700 hover:text-green-900 hover:bg-green-100 transition-colors duration-200 p-1 sm:p-2 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} className="w-3 h-3 sm:w-4 sm:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleHapusPemasukan(item.id)}
                                                    disabled={deletingId === item.id}
                                                    className="text-red-600 hover:text-red-900 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 p-1 sm:p-2 rounded-lg"
                                                    title="Hapus"
                                                >
                                                    {deletingId === item.id ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-600"></div>
                                                    ) : (
                                                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Informasi Jumlah Data */}
            {pemasukanData.length > 0 && (
                <div className="mt-4 text-xs sm:text-sm text-slate-600 flex items-center bg-green-50 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-green-100">
                    <FontAwesomeIcon icon={faRefresh} className="mr-2 text-green-700 flex-shrink-0" />
                    <p>Total {pemasukanData.length} data pemasukan • Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}</p>
                </div>
            )}
        </section>
    )
}

export default Pemasukan