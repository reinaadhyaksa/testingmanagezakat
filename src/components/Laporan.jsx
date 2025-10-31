import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSync,
    faFilter,
    faCalendarAlt,
    faMapMarkerAlt,
    faUsers,
    faMoneyBillWave,
    faChartBar,
    faDonate,
    faHandHoldingUsd,
    faExclamationTriangle,
    faRefresh,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons';

const Laporan = () => {
    const [pemasukanData, setPemasukanData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // State untuk filter
    const [filters, setFilters] = useState({
        bulan: '',
        dusun: ''
    });

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
    ];

    // Fungsi untuk mengambil data pemasukan
    const fetchPemasukan = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pemasukanomcar')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPemasukanData(data || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fungsi untuk refresh data manual
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPemasukan();
    };

    // Fungsi untuk memformat currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Fungsi untuk parse currency dari string ke number
    const parseCurrency = (currencyString) => {
        if (typeof currencyString === 'number') return currencyString;
        return parseInt(currencyString.replace(/[^\d]/g, '')) || 0;
    };

    // Dapatkan list dusun dari data yang tersedia
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

    // Gunakan useMemo untuk memproses data laporan
    const laporan = useMemo(() => {
        // Filter data berdasarkan bulan dan dusun
        let filtered = pemasukanData;

        if (filters.bulan) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);
                const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
                return itemMonth === filters.bulan;
            });
        }

        if (filters.dusun && filters.dusun !== 'Semua Dusun') {
            filtered = filtered.filter(item => item.dusun === filters.dusun);
        }

        // Group by dusun
        const dusunMap = {};
        let totalMuzaki = 0;
        let totalInfaqTetap = 0;
        let totalInfaqTidakTetap = 0;
        let totalSeluruh = 0;

        filtered.forEach(item => {
            const dusun = item.dusun;
            if (!dusunMap[dusun]) {
                dusunMap[dusun] = {
                    dusun: dusun,
                    muzaki: new Set(),
                    infaqTetap: 0,
                    infaqTidakTetap: 0,
                    total: 0
                };
            }

            // Semua jenis pembayaran dihitung sebagai muzaki
            dusunMap[dusun].muzaki.add(item.muzaki);

            // Kategorikan jenis infaq
            const jumlah = parseCurrency(item.jumlah);

            if (item.jenis === 'Zakat Fitrah' || item.jenis === 'Zakat Maal') {
                dusunMap[dusun].infaqTetap += jumlah;
            } else if (item.jenis === 'Infaq' || item.jenis === 'Sedekah') {
                dusunMap[dusun].infaqTidakTetap += jumlah;
            }

            dusunMap[dusun].total += jumlah;
        });

        // Convert to array dan hitung totals
        const laporanData = Object.values(dusunMap).map(item => {
            totalMuzaki += item.muzaki.size;
            totalInfaqTetap += item.infaqTetap;
            totalInfaqTidakTetap += item.infaqTidakTetap;
            totalSeluruh += item.total;

            return {
                ...item,
                jumlahMuzaki: item.muzaki.size
            };
        });

        // Urutkan data dusun secara alfabetis
        laporanData.sort((a, b) => a.dusun.localeCompare(b.dusun));

        return {
            data: laporanData,
            totals: {
                totalMuzaki,
                totalInfaqTetap,
                totalInfaqTidakTetap,
                totalSeluruh
            },
            filteredCount: filtered.length
        };
    }, [pemasukanData, filters]);

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Reset filter dusun jika dusun yang dipilih tidak ada dalam data yang difilter
    useEffect(() => {
        if (filters.dusun && filters.dusun !== 'Semua Dusun') {
            const dusunExists = laporan.data.some(item => item.dusun === filters.dusun);
            if (!dusunExists && laporan.data.length > 0) {
                setFilters(prev => ({
                    ...prev,
                    dusun: 'Semua Dusun'
                }));
            }
        }
    }, [laporan.data, filters.dusun]);

    // Setup realtime subscription
    useEffect(() => {
        fetchPemasukan();

        const subscription = supabase
            .channel('pemasukanomcar-laporan-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pemasukanomcar'
                },
                (payload) => {
                    console.log('Realtime change received for laporan:', payload);
                    fetchPemasukan();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading && pemasukanData.length === 0) {
        return (
            <section className="mb-12">
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            </section>
        );
    }

    if (error) {
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
        );
    }

    return (
        <section className="mb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Laporan Keuangan</h2>
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
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800">Filter Laporan</h3>
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
                            className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-sm sm:text-base"
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
                            className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 bg-white text-sm sm:text-base"
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
                        <p className="text-xs text-slate-500 mt-1 sm:mt-2">
                            {listDusun.length - 1} dusun tersedia dalam data
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-green-50 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                            <FontAwesomeIcon icon={faUsers} className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-slate-600 truncate">Total Muzaki</p>
                            <p className="text-lg sm:text-xl font-bold text-slate-800 truncate">{laporan.totals.totalMuzaki} Orang</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-green-50 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                            <FontAwesomeIcon icon={faDonate} className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-slate-600 truncate">Infaq Tetap</p>
                            <p className="text-lg sm:text-xl font-bold text-green-700 truncate">{formatCurrency(laporan.totals.totalInfaqTetap)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-green-50 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-teal-100 rounded-lg mr-3">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-slate-600 truncate">Infaq Tidak Tetap</p>
                            <p className="text-lg sm:text-xl font-bold text-teal-700 truncate">{formatCurrency(laporan.totals.totalInfaqTidakTetap)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-green-50 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-lime-100 rounded-lg mr-3">
                            <FontAwesomeIcon icon={faHandHoldingUsd} className="w-4 h-4 sm:w-5 sm:h-5 text-lime-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-slate-600 truncate">Total Seluruh</p>
                            <p className="text-lg sm:text-xl font-bold text-lime-700 truncate">{formatCurrency(laporan.totals.totalSeluruh)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabel Laporan per Dusun */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-green-50">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-green-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="flex items-center">
                            <FontAwesomeIcon icon={faFileAlt} className="text-green-700 mr-2 text-sm sm:text-base" />
                            <h3 className="text-base sm:text-lg font-semibold text-slate-800">Rekap per Dusun</h3>
                        </div>
                        {laporan.data.length > 0 && (
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors duration-200 shadow-sm self-start sm:self-auto"
                            >
                                {refreshing ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                ) : (
                                    <FontAwesomeIcon icon={faSync} className="h-3 w-3" />
                                )}
                                <span>
                                    {refreshing ? 'Memperbarui...' : 'Refresh'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-green-100">
                        <thead className="bg-green-50">
                            <tr>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Dusun
                                </th>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Muzaki
                                </th>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Infaq Tetap
                                </th>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Infaq Tidak Tetap
                                </th>
                                <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-green-100">
                            {laporan.data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 sm:px-6 py-6 sm:py-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <FontAwesomeIcon icon={faChartBar} className="text-green-400 text-2xl sm:text-3xl mb-2" />
                                            <p className="text-sm sm:text-base mb-3">Tidak ada data yang ditemukan</p>
                                            <button
                                                onClick={handleRefresh}
                                                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center text-sm transition-colors duration-200 shadow-sm"
                                            >
                                                <FontAwesomeIcon icon={faRefresh} className="h-4 w-4 mr-2" />
                                                Refresh Data
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {laporan.data.map((item, index) => (
                                        <tr key={index} className="hover:bg-green-50 transition-colors duration-200">
                                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-800">
                                                {item.dusun}
                                            </td>
                                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                                {item.jumlahMuzaki} Orang
                                            </td>
                                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-green-700 font-medium">
                                                {formatCurrency(item.infaqTetap)}
                                            </td>
                                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-teal-700 font-medium">
                                                {formatCurrency(item.infaqTidakTetap)}
                                            </td>
                                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-lime-700 font-bold">
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Total Row */}
                                    <tr className="bg-green-50 font-semibold border-t-2 border-green-200">
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            TOTAL
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-slate-800">
                                            {laporan.totals.totalMuzaki} Orang
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-green-700">
                                            {formatCurrency(laporan.totals.totalInfaqTetap)}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-teal-700">
                                            {formatCurrency(laporan.totals.totalInfaqTidakTetap)}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-lime-700">
                                            {formatCurrency(laporan.totals.totalSeluruh)}
                                        </td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Informasi Filter */}
            <div className="mt-4 text-xs sm:text-sm text-slate-600 flex items-center bg-green-50 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-green-100">
                <FontAwesomeIcon icon={faChartBar} className="mr-2 text-green-700 flex-shrink-0" />
                <p className="break-words">
                    Menampilkan data untuk: {filters.bulan ? listBulan.find(b => b.value === filters.bulan)?.label : 'Semua Bulan'} •
                    {filters.dusun ? ` ${filters.dusun}` : ' Semua Dusun'} •
                    Total {laporan.filteredCount} transaksi •
                    {listDusun.length - 1} dusun tersedia
                    {refreshing && ' • Memperbarui data...'}
                </p>
            </div>
        </section>
    );
};

export default Laporan;