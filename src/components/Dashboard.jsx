import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSync,
    faFilter,
    faCalendarAlt,
    faMapMarkerAlt,
    faEye,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import {
    faMoneyBillAlt,
    faChartBar,
    faUsers,
    faWallet,
    faArrowUp,
    faArrowDown,
    faBalanceScale
} from '@fortawesome/free-solid-svg-icons'

const Dashboard = () => {
    const [currentMonth, setCurrentMonth] = useState('')
    const [pemasukanData, setPemasukanData] = useState([])
    const [pengeluaranData, setPengeluaranData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    // State untuk filter
    const [filters, setFilters] = useState({
        bulan: '',
        dusun: ''
    })

    // List bulan
    const listBulan = [
        { value: '', label: 'Semua Bulan' },
        { value: '01', label: 'Januari' },
        { value: '02', label: 'Februari' },
        { value: '03', label: 'Maret' },
        { value: '04', label: 'April' },
        { value: '05', label: 'Mei' },
        { value: '06', label: 'Juni' },
        { value: '07', label: 'Juli' },
        { value: '08', label: 'Agustus' },
        { value: '09', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' }
    ]

    // Fungsi untuk mengambil data pemasukan
    const fetchPemasukan = async () => {
        try {
            const { data, error } = await supabase
                .from('pemasukanomcar')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching pemasukan data:', error)
            throw error
        }
    }

    // Fungsi untuk mengambil data pengeluaran
    const fetchPengeluaran = async () => {
        try {
            const { data, error } = await supabase
                .from('pengeluaranomcar')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching pengeluaran data:', error)
            throw error
        }
    }

    // Fungsi untuk mengambil semua data
    const fetchAllData = async () => {
        try {
            setLoading(true)
            const [pemasukan, pengeluaran] = await Promise.all([
                fetchPemasukan(),
                fetchPengeluaran()
            ])

            setPemasukanData(pemasukan)
            setPengeluaranData(pengeluaran)
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
        await fetchAllData()
    }

    // Fungsi untuk memformat currency
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

    // Fungsi untuk parse currency dari string ke number
    const parseCurrency = (currencyString) => {
        if (typeof currencyString === 'number') return currencyString
        return parseInt(currencyString.replace(/[^\d]/g, '')) || 0
    }

    // Dapatkan list dusun dari data pemasukan yang tersedia
    const listDusun = useMemo(() => {
        const dusunSet = new Set();
        pemasukanData.forEach(item => {
            if (item.dusun) {
                dusunSet.add(item.dusun);
            }
        });

        // Urutkan dusun secara alfabetis
        const dusunArray = Array.from(dusunSet).sort();

        // Tambahkan opsi "Semua Dusun" di awal
        return ['Semua Dusun', ...dusunArray];
    }, [pemasukanData]);

    // Filter data berdasarkan bulan dan dusun
    const filteredPemasukan = pemasukanData.filter(item => {
        // Filter berdasarkan bulan
        if (filters.bulan) {
            const itemDate = new Date(item.created_at)
            const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0')
            if (itemMonth !== filters.bulan) return false
        }

        // Filter berdasarkan dusun
        if (filters.dusun && filters.dusun !== 'Semua Dusun') {
            if (item.dusun !== filters.dusun) return false
        }

        return true
    })

    const filteredPengeluaran = pengeluaranData.filter(item => {
        // Filter berdasarkan bulan
        if (filters.bulan) {
            const itemDate = new Date(item.created_at)
            const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0')
            if (itemMonth !== filters.bulan) return false
        }

        return true
    })

    // Hitung statistik
    const calculateStats = () => {
        let totalPemasukan = 0
        let totalPengeluaran = 0
        const muzakiSet = new Set()

        // Hitung total pemasukan dan jumlah muzaki
        filteredPemasukan.forEach(item => {
            const jumlah = parseCurrency(item.jumlah)
            totalPemasukan += jumlah
            muzakiSet.add(item.muzaki)
        })

        // Hitung total pengeluaran
        filteredPengeluaran.forEach(item => {
            const jumlah = parseCurrency(item.jumlah)
            totalPengeluaran += jumlah
        })

        const saldo = totalPemasukan - totalPengeluaran

        return {
            totalPemasukan,
            totalPengeluaran,
            saldo,
            jumlahMuzaki: muzakiSet.size
        }
    }

    // Ambil 5 pemasukan terbaru
    const recentTransactions = filteredPemasukan.slice(0, 5)

    const stats = calculateStats()

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }))
    }

    // Reset filter dusun jika dusun yang dipilih tidak ada dalam data yang tersedia
    useEffect(() => {
        if (filters.dusun && filters.dusun !== 'Semua Dusun') {
            const dusunExists = pemasukanData.some(item => item.dusun === filters.dusun);
            if (!dusunExists && pemasukanData.length > 0) {
                setFilters(prev => ({
                    ...prev,
                    dusun: 'Semua Dusun'
                }));
            }
        }
    }, [pemasukanData, filters.dusun]);

    // Update judul bulan berdasarkan filter
    useEffect(() => {
        if (filters.bulan) {
            // Jika ada filter bulan, gunakan bulan yang dipilih
            const selectedBulan = listBulan.find(b => b.value === filters.bulan);
            const now = new Date();
            const year = now.getFullYear();
            setCurrentMonth(`${selectedBulan?.label} ${year}`);
        } else {
            // Jika tidak ada filter bulan, gunakan bulan saat ini
            const now = new Date();
            const options = { year: 'numeric', month: 'long' };
            setCurrentMonth(now.toLocaleDateString('id-ID', options));
        }
    }, [filters.bulan]);

    // Setup realtime subscription dan initial data
    useEffect(() => {
        // Set judul bulan awal
        const now = new Date();
        const options = { year: 'numeric', month: 'long' };
        setCurrentMonth(now.toLocaleDateString('id-ID', options));

        fetchAllData()

        // Subscribe untuk perubahan data pemasukan
        const pemasukanSubscription = supabase
            .channel('pemasukanomcar-dashboard-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pemasukanomcar'
                },
                (payload) => {
                    console.log('Realtime change received for pemasukan:', payload)
                    fetchAllData()
                }
            )
            .subscribe()

        // Subscribe untuk perubahan data pengeluaran
        const pengeluaranSubscription = supabase
            .channel('pengeluaranomcar-dashboard-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pengeluaranomcar'
                },
                (payload) => {
                    console.log('Realtime change received for pengeluaran:', payload)
                    fetchAllData()
                }
            )
            .subscribe()

        return () => {
            pemasukanSubscription.unsubscribe()
            pengeluaranSubscription.unsubscribe()
        }
    }, [])

    const statCards = [
        {
            title: 'Total Pemasukan',
            value: formatCurrency(stats.totalPemasukan),
            color: 'green',
            icon: faArrowUp
        },
        {
            title: 'Total Pengeluaran',
            value: formatCurrency(stats.totalPengeluaran),
            color: 'emerald',
            icon: faArrowDown
        },
        {
            title: 'Saldo Saat Ini',
            value: formatCurrency(stats.saldo),
            color: stats.saldo >= 0 ? 'teal' : 'red',
            icon: faBalanceScale
        },
        {
            title: 'Jumlah Muzaki',
            value: `${stats.jumlahMuzaki} Orang`,
            color: 'lime',
            icon: faUsers
        }
    ]

    const getColorClasses = (color) => {
        const colors = {
            green: {
                border: 'border-green-600',
                bg: 'bg-green-50',
                icon: 'text-green-700',
                text: 'text-green-700'
            },
            emerald: {
                border: 'border-emerald-600',
                bg: 'bg-emerald-50',
                icon: 'text-emerald-700',
                text: 'text-emerald-700'
            },
            teal: {
                border: 'border-teal-600',
                bg: 'bg-teal-50',
                icon: 'text-teal-700',
                text: 'text-teal-700'
            },
            lime: {
                border: 'border-lime-600',
                bg: 'bg-lime-50',
                icon: 'text-lime-700',
                text: 'text-lime-700'
            },
            red: {
                border: 'border-red-500',
                bg: 'bg-red-50',
                icon: 'text-red-600',
                text: 'text-red-600'
            }
        }
        return colors[color] || colors.green
    }

    if (loading && pemasukanData.length === 0 && pengeluaranData.length === 0) {
        return (
            <section className="mb-12">
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="mb-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                    <div className="flex items-center mb-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2" />
                        <p className="text-red-800 font-medium text-sm sm:text-base">Error Loading Data</p>
                    </div>
                    <p className="text-red-700 text-xs sm:text-sm mb-3">{error}</p>
                    <button
                        onClick={fetchAllData}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                        Coba Lagi
                    </button>
                </div>
            </section>
        )
    }

    return (
        <section className="mb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
                    Dashboard Ringkasan {filters.bulan ? `- ${currentMonth}` : `- ${currentMonth}`}
                </h2>
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
                        className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm text-sm sm:text-base"
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
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 border border-green-50">
                <div className="flex items-center mb-4">
                    <FontAwesomeIcon icon={faFilter} className="text-green-700 mr-2 text-sm sm:text-base" />
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800">Filter Dashboard</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-600" />
                            Bulan
                        </label>
                        <select
                            value={filters.bulan}
                            onChange={(e) => handleFilterChange('bulan', e.target.value)}
                            className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors duration-200 text-sm sm:text-base"
                        >
                            {listBulan.map(bulan => (
                                <option key={bulan.value} value={bulan.value}>
                                    {bulan.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-green-600" />
                            Dusun
                        </label>
                        <select
                            value={filters.dusun}
                            onChange={(e) => handleFilterChange('dusun', e.target.value)}
                            className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors duration-200 text-sm sm:text-base"
                        >
                            {listDusun.length === 0 ? (
                                <option value="">Loading dusun...</option>
                            ) : (
                                listDusun.map(dusun => (
                                    <option key={dusun} value={dusun}>
                                        {dusun}
                                    </option>
                                ))
                            )}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            {listDusun.length - 1} dusun tersedia dalam data
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {statCards.map((card, index) => {
                    const colorClasses = getColorClasses(card.color)
                    return (
                        <div key={index} className={`bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 ${colorClasses.border} hover:shadow-md transition-shadow duration-200`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">{card.title}</p>
                                    <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${colorClasses.text} break-words`}>
                                        {card.value}
                                    </h3>
                                </div>
                                <div className={`${colorClasses.bg} p-2 sm:p-3 rounded-lg ml-3 flex-shrink-0`}>
                                    <FontAwesomeIcon
                                        icon={card.icon}
                                        className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${colorClasses.icon}`}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-green-50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                        5 Pemasukan Terbaru
                        {filters.bulan || filters.dusun !== '' ? ' (Filtered)' : ''}
                    </h3>
                    <button
                        className="flex items-center space-x-1 text-green-700 text-sm font-medium hover:text-green-900 transition-colors duration-200 hover:bg-green-50 px-3 py-2 rounded-lg self-start sm:self-auto"
                        onClick={() => {
                            // Arahkan ke halaman pemasukan
                            window.location.href = '/pemasukan'
                        }}
                    >
                        <FontAwesomeIcon icon={faEye} className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Lihat Semua</span>
                    </button>
                </div>

                {recentTransactions.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                        <p className="text-slate-500 text-sm sm:text-base">Tidak ada data pemasukan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-green-100">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider bg-green-50">Tanggal</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider bg-green-50">Dusun</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider bg-green-50">Muzaki</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider bg-green-50">Jenis</th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider bg-green-50">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-green-100">
                                {recentTransactions.map((transaction, index) => (
                                    <tr key={transaction.id || index} className="hover:bg-green-50 transition-colors duration-150">
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {transaction.date}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {transaction.dusun}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {transaction.muzaki}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${transaction.jenis === 'Zakat Fitrah' ? 'bg-green-100 text-green-800 border border-green-200' :
                                                transaction.jenis === 'Zakat Maal' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                    transaction.jenis === 'Infaq' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                                                        'bg-lime-100 text-lime-800 border border-lime-200'
                                                }`}>
                                                {transaction.jenis}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-800">
                                            {formatCurrency(transaction.jumlah)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Informasi Filter */}
            <div className="mt-4 text-sm text-slate-600 flex items-center bg-green-50 px-4 py-3 rounded-lg border border-green-100">
                <FontAwesomeIcon icon={faChartBar} className="mr-2 text-green-700" />
                <p>
                    Menampilkan data untuk: {filters.bulan ? listBulan.find(b => b.value === filters.bulan)?.label : 'Semua Bulan'} •
                    {filters.dusun ? ` ${filters.dusun}` : ' Semua Dusun'} •
                    Total {filteredPemasukan.length} transaksi pemasukan •
                    {listDusun.length - 1} dusun tersedia
                    {refreshing && ' • Memperbarui data...'}
                </p>
            </div>
        </section>
    )
}

export default Dashboard