import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSync,
    faPlus,
    faEdit,
    faTrash,
    faExclamationTriangle,
    faRefresh,
    faWifi,
    faCircle,
    faHandHoldingHeart
} from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

const Pengeluaran = () => {
    const [pengeluaranData, setPengeluaranData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [realtimeStatus, setRealtimeStatus] = useState('connecting')
    const [refreshing, setRefreshing] = useState(false)

    const navigate = useNavigate()

    // Fungsi untuk mengambil data pengeluaran
    const fetchPengeluaran = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('pengeluaranomcar')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setPengeluaranData(data || [])
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
        await fetchPengeluaran()
    }

    // Fungsi untuk navigasi ke halaman tambah data
    const handleTambahPengeluaran = () => {
        navigate('/pengeluaran/tambah')
    }

    // Fungsi untuk navigasi ke halaman edit data
    const handleEditPengeluaran = (id) => {
        navigate(`/pengeluaran/edit/${id}`)
    }

    // Fungsi untuk menghapus data
    const handleHapusPengeluaran = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) {
            return
        }

        try {
            setDeletingId(id)
            setError(null)

            const { error } = await supabase
                .from('pengeluaranomcar')
                .delete()
                .eq('id', id)

            if (error) throw error

            console.log('Data berhasil dihapus')

            // Force refresh data setelah hapus
            await fetchPengeluaran()

            alert('Data berhasil dihapus!')

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
        let subscription
        let retryCount = 0
        const maxRetries = 3

        const setupRealtime = async () => {
            try {
                console.log('Setting up realtime subscription...')
                setRealtimeStatus('connecting')

                // Ambil data pertama kali
                await fetchPengeluaran()

                // Setup realtime subscription
                subscription = supabase
                    .channel('pengeluaranomcar-public-changes')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'pengeluaranomcar'
                        },
                        (payload) => {
                            console.log('Realtime change received:', payload)
                            setRealtimeStatus('connected')

                            // Handle different event types
                            if (payload.eventType === 'INSERT') {
                                setPengeluaranData(prev => [payload.new, ...prev])
                            } else if (payload.eventType === 'UPDATE') {
                                setPengeluaranData(prev =>
                                    prev.map(item =>
                                        item.id === payload.new.id ? payload.new : item
                                    )
                                )
                            } else if (payload.eventType === 'DELETE') {
                                setPengeluaranData(prev =>
                                    prev.filter(item => item.id !== payload.old.id)
                                )
                            }
                        }
                    )
                    .subscribe((status) => {
                        console.log('Realtime subscription status:', status)

                        if (status === 'SUBSCRIBED') {
                            setRealtimeStatus('connected')
                            retryCount = 0
                            console.log('✅ Realtime subscription connected')
                        }

                        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                            console.error('❌ Realtime subscription error:', status)
                            setRealtimeStatus('error')
                            if (retryCount < maxRetries) {
                                retryCount++
                                console.log(`🔄 Retrying subscription... (${retryCount}/${maxRetries})`)
                                setTimeout(setupRealtime, 2000 * retryCount)
                            } else {
                                console.log('❌ Max retries reached, giving up on realtime')
                            }
                        }
                    })

            } catch (error) {
                console.error('Error setting up realtime:', error)
                setRealtimeStatus('error')
            }
        }

        setupRealtime()

        return () => {
            if (subscription) {
                subscription.unsubscribe()
                setRealtimeStatus('disconnected')
                console.log('🔴 Realtime subscription unsubscribed')
            }
        }
    }, [])

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    // List kategori pengeluaran
    const listKategori = [
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

    // Tampilkan status realtime di UI
    const getRealtimeStatusColor = () => {
        switch (realtimeStatus) {
            case 'connected': return 'bg-green-500'
            case 'connecting': return 'bg-yellow-500'
            case 'error': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    const getRealtimeStatusIcon = () => {
        switch (realtimeStatus) {
            case 'connected': return faWifi
            case 'connecting': return faCircle
            case 'error': return faExclamationTriangle
            default: return faCircle
        }
    }

    // Badge color untuk kategori
    const getKategoriColor = (kategori) => {
        switch (kategori) {
            case 'Fakir Miskin': return 'bg-red-100 text-red-800 border border-red-200'
            case 'Anak Yatim': return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            case 'Fisabilillah': return 'bg-green-100 text-green-800 border border-green-200'
            case 'Mualaf': return 'bg-teal-100 text-teal-800 border border-teal-200'
            case 'Amil': return 'bg-lime-100 text-lime-800 border border-lime-200'
            case 'Ibnu Sabil': return 'bg-cyan-100 text-cyan-800 border border-cyan-200'
            case 'Gharimin': return 'bg-orange-100 text-orange-800 border border-orange-200'
            case 'Bantuan Pendidikan': return 'bg-sky-100 text-sky-800 border border-sky-200'
            case 'Bantuan Kesehatan': return 'bg-rose-100 text-rose-800 border border-rose-200'
            case 'Operasional': return 'bg-slate-100 text-slate-800 border border-slate-200'
            default: return 'bg-slate-100 text-slate-800 border border-slate-200'
        }
    }

    if (loading && pengeluaranData.length === 0) {
        return (
            <section className="mb-12">
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            </section>
        )
    }

    if (error && pengeluaranData.length === 0) {
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
                            onClick={fetchPengeluaran}
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
                <div className="flex items-center">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Manajemen Pengeluaran</h2>
                    {/* Realtime Status Indicator */}
                    <div className="ml-3 sm:ml-4 flex items-center">
                        <div className={`w-2 h-2 rounded-full ${getRealtimeStatusColor()} animate-pulse`}></div>
                        <span className="text-xs text-slate-500 ml-1 hidden sm:inline">
                            {realtimeStatus === 'connected' ? 'Live' : realtimeStatus}
                        </span>
                    </div>
                </div>
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
                        onClick={handleTambahPengeluaran}
                        className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center transition-colors duration-200 shadow-sm font-medium text-sm sm:text-base"
                    >
                        <FontAwesomeIcon icon={faPlus} className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        Tambah Pengeluaran
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-green-50">
                {pengeluaranData.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="flex justify-center mb-3">
                            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-green-400 text-3xl sm:text-4xl" />
                        </div>
                        <p className="text-slate-500 text-sm sm:text-base mb-4">Belum ada data pengeluaran</p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                                onClick={handleRefresh}
                                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center text-sm transition-colors duration-200"
                            >
                                <FontAwesomeIcon icon={faRefresh} className="h-4 w-4 mr-2" />
                                Refresh Data
                            </button>
                            <button
                                onClick={handleTambahPengeluaran}
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
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Penerima</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Kategori</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Jumlah</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-green-100">
                                {pengeluaranData.map((item, index) => (
                                    <tr key={item.id || index} className="hover:bg-green-50 transition-colors duration-200">
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {item.date}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {item.penerima}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getKategoriColor(item.kategori)}`}>
                                                {item.kategori}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-800">
                                            {typeof item.jumlah === 'number' ? formatCurrency(item.jumlah) : item.jumlah}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                                            <div className="flex space-x-1 sm:space-x-2">
                                                <button
                                                    onClick={() => handleEditPengeluaran(item.id)}
                                                    className="text-green-700 hover:text-green-900 hover:bg-green-100 transition-colors duration-200 p-1 sm:p-2 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} className="w-3 h-3 sm:w-4 sm:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleHapusPengeluaran(item.id)}
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
            {pengeluaranData.length > 0 && (
                <div className="mt-4 text-xs sm:text-sm text-slate-600 flex items-center bg-green-50 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-green-100">
                    <FontAwesomeIcon icon={faHandHoldingHeart} className="mr-2 text-green-700 flex-shrink-0" />
                    <p>
                        Total {pengeluaranData.length} data pengeluaran •
                        Status: <span className={`font-medium ${realtimeStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {realtimeStatus === 'connected' ? 'Live' : realtimeStatus}
                        </span> •
                        Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
                    </p>
                </div>
            )}
        </section>
    )
}

export default Pengeluaran