import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync, faCalendarAlt, faMapMarkerAlt, faEye, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { faUsers, faArrowUp, faArrowDown, faBalanceScale } from '@fortawesome/free-solid-svg-icons'
import { listBulan } from '../../utils/data'
import { Loading } from '../Loading'

const Dashboard = () => {
    const [currentMonth, setCurrentMonth] = useState('')
    const [pemasukanData, setPemasukanData] = useState([])
    const [pengeluaranData, setPengeluaranData] = useState([])
    const [dusunList, setDusunList] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    const [filters, setFilters] = useState({
        bulan: '',
        dusun: 'Semua Dusun'
    })

    const fetchDusunList = async () => {
        try {
            const { data, error } = await supabase
                .from('dusun')
                .select('*')
                .order('nama')

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching dusun list:', error)
            return []
        }
    }

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

    const fetchAllData = async () => {
        try {
            setLoading(true)
            const [dusun, pemasukan, pengeluaran] = await Promise.all([
                fetchDusunList(),
                fetchPemasukan(),
                fetchPengeluaran()
            ])

            setDusunList(dusun)
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

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchAllData()
    }

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

    const parseCurrency = (currencyString) => {
        if (typeof currencyString === 'number') return currencyString
        return parseInt(currencyString.replace(/[^\d]/g, '')) || 0
    }

    const listDusunForFilter = useMemo(() => {
        const dusunNames = dusunList.map(dusun => dusun.nama)
        return ['Semua Dusun', ...dusunNames]
    }, [dusunList])

    const filteredPemasukan = pemasukanData.filter(item => {
        if (filters.bulan) {
            const itemDate = new Date(item.created_at)
            const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0')
            if (itemMonth !== filters.bulan) return false
        }

        if (filters.dusun && filters.dusun !== 'Semua Dusun') {
            if (item.dusun !== filters.dusun) return false
        }

        return true
    })

    const filteredPengeluaran = pengeluaranData.filter(item => {
        if (filters.bulan) {
            const itemDate = new Date(item.created_at)
            const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0')
            if (itemMonth !== filters.bulan) return false
        }

        return true
    })

    const calculateStats = () => {
        let totalPemasukan = 0
        let totalPengeluaran = 0
        const muzakiSet = new Set()

        filteredPemasukan.forEach(item => {
            const jumlah = parseCurrency(item.jumlah)
            totalPemasukan += jumlah
            muzakiSet.add(item.muzaki)
        })

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

    const recentTransactions = filteredPemasukan.slice(0, 5)

    const stats = calculateStats()

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleDusunChange = (dusun) => {
        setFilters(prev => ({
            ...prev,
            dusun: dusun
        }))
    }

    useEffect(() => {
        if (filters.dusun && filters.dusun !== 'Semua Dusun') {
            const dusunExists = dusunList.some(dusun => dusun.nama === filters.dusun);
            if (!dusunExists && dusunList.length > 0) {
                setFilters(prev => ({
                    ...prev,
                    dusun: 'Semua Dusun'
                }));
            }
        }
    }, [dusunList, filters.dusun]);

    useEffect(() => {
        if (filters.bulan) {
            const selectedBulan = listBulan.find(b => b.value === filters.bulan);
            const now = new Date();
            const year = now.getFullYear();
            setCurrentMonth(`${selectedBulan?.label} ${year}`);
        } else {
            const now = new Date();
            const options = { year: 'numeric', month: 'long' };
            setCurrentMonth(now.toLocaleDateString('id-ID', options));
        }
    }, [filters.bulan]);

    useEffect(() => {
        const now = new Date();
        const options = { year: 'numeric', month: 'long' };
        setCurrentMonth(now.toLocaleDateString('id-ID', options));

        fetchAllData()

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

        const dusunSubscription = supabase
            .channel('dusun-dashboard-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dusun'
                },
                (payload) => {
                    console.log('Realtime change received for dusun:', payload)
                    fetchDusunList().then(data => setDusunList(data || []))
                }
            )
            .subscribe()

        return () => {
            pemasukanSubscription.unsubscribe()
            pengeluaranSubscription.unsubscribe()
            dusunSubscription.unsubscribe()
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
            color: 'red',
            icon: faArrowDown
        },
        {
            title: 'Saldo Saat Ini',
            value: formatCurrency(stats.saldo),
            color: stats.saldo >= 0 ? 'blue' : 'orange',
            icon: faBalanceScale
        },
        {
            title: 'Jumlah Muzaki',
            value: `${stats.jumlahMuzaki} Orang`,
            color: 'purple',
            icon: faUsers
        }
    ]

    const getColorClasses = (color) => {
        const colors = {
            green: {
                bg: 'bg-green-100',
                icon: 'text-green-700',
                text: 'text-slate-800'
            },
            red: {
                bg: 'bg-red-100',
                icon: 'text-red-700',
                text: 'text-slate-800'
            },
            blue: {
                bg: 'bg-blue-100',
                icon: 'text-blue-700',
                text: 'text-slate-800'
            },
            orange: {
                bg: 'bg-orange-100',
                icon: 'text-orange-700',
                text: 'text-slate-800'
            },
            purple: {
                bg: 'bg-purple-100',
                icon: 'text-purple-700',
                text: 'text-slate-800'
            }
        }
        return colors[color] || colors.green
    }

    if (loading && pemasukanData.length === 0 && pengeluaranData.length === 0) {
        return (
            <Loading />
        )
    }

    if (error) {
        return (
            <section className="mb-12 mx-4 sm:mx-6 lg:mx-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
                    <div className="flex items-center mb-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-2 text-sm sm:text-base" />
                        <p className="text-red-800 font-medium text-sm sm:text-base">Error Loading Data</p>
                    </div>
                    <p className="text-red-700 text-xs sm:text-sm mb-3">{error}</p>
                    <button
                        onClick={fetchAllData}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200"
                    >
                        Coba Lagi
                    </button>
                </div>
            </section>
        )
    }

    return (
        <>
            <section className="mb-12 mx-4 sm:mx-6 lg:mx-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                            Dashboard
                        </h2>
                        <p className="text-slate-600 text-sm sm:text-base">
                            Ringkasan keuangan {filters.bulan ? `- ${currentMonth}` : `- ${currentMonth}`}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                        {loading && (
                            <div className="flex items-center text-slate-600">
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-green-700 mr-2"></div>
                                <span className="text-xs sm:text-sm">Updating...</span>
                            </div>
                        )}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm text-xs sm:text-sm"
                        >
                            {refreshing ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                                <FontAwesomeIcon icon={faSync} className="h-3 w-3" />
                            )}
                            <span className="font-medium">
                                {refreshing ? 'Memperbarui...' : 'Refresh'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-3 sm:mb-0">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Filter Dashboard</h3>
                            <p className="text-slate-600 text-xs sm:text-sm">Saring data berdasarkan bulan dan dusun</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                                Bulan
                            </label>
                            <select
                                value={filters.bulan}
                                onChange={(e) => handleFilterChange('bulan', e.target.value)}
                                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-xs sm:text-sm"
                            >
                                {listBulan.map(bulan => (
                                    <option key={bulan.value} value={bulan.value}>
                                        {bulan.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                                Dusun
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 max-h-32 overflow-y-auto p-2 border border-green-300 rounded-lg">
                                {listDusunForFilter.length === 0 ? (
                                    <div className="col-span-full">
                                        <p className="text-slate-500 text-xs sm:text-sm py-2 text-center">
                                            Belum ada dusun
                                        </p>
                                    </div>
                                ) : (
                                    listDusunForFilter.map((dusun) => (
                                        <label key={dusun} className="flex items-center space-x-2 p-1 sm:p-2 border border-green-200 rounded hover:bg-green-50 cursor-pointer transition-colors duration-200">
                                            <input
                                                type="radio"
                                                name="dusun"
                                                value={dusun}
                                                checked={filters.dusun === dusun}
                                                onChange={() => handleDusunChange(dusun)}
                                                className="text-green-600 focus:ring-green-500 w-3 h-3 sm:w-4 sm:h-4"
                                            />
                                            <span className="text-xs text-slate-700 truncate" title={dusun}>
                                                {dusun}
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {statCards.map((card, index) => {
                        const colorClasses = getColorClasses(card.color)
                        return (
                            <div key={index} className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-lg mr-2 sm:mr-3 ${colorClasses.bg}`}>
                                        <FontAwesomeIcon icon={card.icon} className={`w-3 h-3 sm:w-4 sm:h-4 ${colorClasses.icon}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-slate-600">{card.title}</p>
                                        <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">{card.value}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-green-200 overflow-hidden">
                    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-green-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                            <div>
                                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800">
                                    Transaksi Terbaru
                                </h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    {filters.bulan || filters.dusun !== 'Semua Dusun' ? 'Data dengan filter yang diterapkan' : 'Data pemasukan terbaru'}
                                </p>
                            </div>
                            <button
                                className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 shadow-sm"
                                onClick={() => {
                                    window.location.href = '/pemasukan'
                                }}
                            >
                                <FontAwesomeIcon icon={faEye} className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Lihat Semua</span>
                            </button>
                        </div>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <div className="flex flex-col items-center">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-slate-300 text-2xl sm:text-3xl mb-2" />
                                <p className="text-slate-500 text-xs sm:text-sm mb-3">Tidak ada data transaksi</p>
                                <button
                                    onClick={handleRefresh}
                                    className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center text-xs sm:text-sm transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faSync} className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                    Refresh Data
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-green-50 border-b border-green-200">
                                    <tr>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Tanggal
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Dusun
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Muzaki
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Jenis
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Jumlah
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-200">
                                    {recentTransactions.map((transaction, index) => (
                                        <tr key={transaction.id || index} className="hover:bg-green-50 transition-colors">
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-2 text-slate-400" />
                                                    {transaction.date}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 mr-2 text-slate-400" />
                                                    {transaction.dusun}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faUsers} className="w-3 h-3 mr-2 text-slate-400" />
                                                    {transaction.muzaki}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${transaction.jenis === 'Zakat Fitrah' ? 'bg-green-100 text-green-800 border-green-300' :
                                                    transaction.jenis === 'Zakat Maal' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                        transaction.jenis === 'Infaq' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                                            'bg-orange-100 text-orange-800 border-orange-300'
                                                    }`}>
                                                    {transaction.jenis}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-green-700">
                                                {formatCurrency(transaction.jumlah)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {recentTransactions.length > 0 && (
                    <div className="mt-4 sm:mt-6 bg-green-50 border border-green-300 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-green-800">
                                <FontAwesomeIcon icon={faSync} className="mr-2 text-sm" />
                                <span className="text-xs sm:text-sm">
                                    Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
                                </span>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="text-green-700 hover:text-green-900 text-xs sm:text-sm font-medium flex items-center"
                            >
                                <FontAwesomeIcon icon={faSync} className="mr-1 text-sm" />
                                Refresh
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </>
    )
}

export default Dashboard