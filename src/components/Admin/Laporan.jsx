import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faFilter, faCalendarAlt, faMapMarkerAlt, faUsers, faMoneyBillWave, faChartBar, faDonate, faHandHoldingUsd, faExclamationTriangle, faRefresh, faFileAlt, faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { listBulan } from '../../utils/data';
import { Loading } from '../Loading';

const Laporan = () => {
    const [pemasukanData, setPemasukanData] = useState([]);
    const [dusunList, setDusunList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [exportLoading, setExportLoading] = useState(null);

    const [filters, setFilters] = useState({
        bulan: '',
        dusun: 'Semua Dusun'
    });

    const fetchDusunList = async () => {
        try {
            const { data, error } = await supabase
                .from('dusun')
                .select('*')
                .order('nama');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching dusun list:', error);
            return [];
        }
    };

    const fetchPemasukan = async () => {
        try {
            const { data, error } = await supabase
                .from('pemasukanomcar')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    };

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [dusun, pemasukan] = await Promise.all([
                fetchDusunList(),
                fetchPemasukan()
            ]);

            setDusunList(dusun);
            setPemasukanData(pemasukan);
            setError(null);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatCurrencyForExport = (amount) => {
        const numericAmount = typeof amount === 'string'
            ? parseFloat(amount.replace(/[^\d]/g, ''))
            : amount;

        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(numericAmount);
    };

    const parseCurrency = (currencyString) => {
        if (typeof currencyString === 'number') return currencyString;
        return parseInt(currencyString.replace(/[^\d]/g, '')) || 0;
    };

    const listDusunForFilter = useMemo(() => {
        const dusunNames = dusunList.map(dusun => dusun.nama);
        return ['Semua Dusun', ...dusunNames];
    }, [dusunList]);

    // Format tanggal untuk tampilan
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format tanggal untuk grouping
    const formatDateForGrouping = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID');
    };

    const laporan = useMemo(() => {
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

        // Group data by date
        const dateGroups = {};

        filtered.forEach(item => {
            const dateKey = formatDateForGrouping(item.created_at);
            const fullDate = item.created_at;

            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = {
                    date: dateKey,
                    fullDate: fullDate,
                    items: [],
                    dusunMap: {},
                    totals: {
                        totalMuzaki: 0,
                        totalInfaqTetap: 0,
                        totalInfaqTidakTetap: 0,
                        totalSeluruh: 0
                    }
                };
            }

            dateGroups[dateKey].items.push(item);

            // Process per dusun for this date
            const dusun = item.dusun;
            if (!dateGroups[dateKey].dusunMap[dusun]) {
                dateGroups[dateKey].dusunMap[dusun] = {
                    dusun: dusun,
                    muzaki: new Set(),
                    infaqTetap: 0,
                    infaqTidakTetap: 0,
                    total: 0
                };
            }

            dateGroups[dateKey].dusunMap[dusun].muzaki.add(item.muzaki);

            const jumlah = parseCurrency(item.jumlah);

            if (item.jenisinfaq === 'tetap') {
                dateGroups[dateKey].dusunMap[dusun].infaqTetap += jumlah;
                dateGroups[dateKey].totals.totalInfaqTetap += jumlah;
            } else if (item.jenisinfaq === 'tidak tetap') {
                dateGroups[dateKey].dusunMap[dusun].infaqTidakTetap += jumlah;
                dateGroups[dateKey].totals.totalInfaqTidakTetap += jumlah;
            }

            dateGroups[dateKey].dusunMap[dusun].total += jumlah;
            dateGroups[dateKey].totals.totalSeluruh += jumlah;
        });

        // Convert dusunMap to array and calculate muzaki count
        Object.keys(dateGroups).forEach(dateKey => {
            const group = dateGroups[dateKey];
            group.dusunData = Object.values(group.dusunMap).map(item => ({
                ...item,
                jumlahMuzaki: item.muzaki.size
            }));

            // Calculate total muzaki for this date
            group.totals.totalMuzaki = group.dusunData.reduce((sum, item) => sum + item.jumlahMuzaki, 0);

            // Sort dusun data
            group.dusunData.sort((a, b) => a.dusun.localeCompare(b.dusun));
        });

        // Convert to array and sort by date (newest first)
        const laporanData = Object.values(dateGroups).sort((a, b) =>
            new Date(b.fullDate) - new Date(a.fullDate)
        );

        // Calculate overall totals
        const overallTotals = {
            totalMuzaki: laporanData.reduce((sum, group) => sum + group.totals.totalMuzaki, 0),
            totalInfaqTetap: laporanData.reduce((sum, group) => sum + group.totals.totalInfaqTetap, 0),
            totalInfaqTidakTetap: laporanData.reduce((sum, group) => sum + group.totals.totalInfaqTidakTetap, 0),
            totalSeluruh: laporanData.reduce((sum, group) => sum + group.totals.totalSeluruh, 0)
        };

        return {
            data: laporanData,
            totals: overallTotals,
            filteredCount: filtered.length
        };
    }, [pemasukanData, filters]);

    // Fungsi Export ke PDF berdasarkan tanggal
    const exportToPDF = async () => {
        try {
            setExportLoading('pdf');
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            let startY = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 15;
            const lineHeight = 7; // Pindahkan deklarasi lineHeight ke sini

            const addNewPage = () => {
                doc.addPage();
                startY = margin;

                // Add header for continuation pages
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text('LAPORAN DATA PEMASUKAN PER TANGGAL (Lanjutan)', 105, 15, { align: 'center' });
                doc.text(`Halaman ${doc.internal.getNumberOfPages()}`, 190, 25, { align: 'right' });
            };

            // Info Filter
            const bulanTerpilih = listBulan.find(b => b.value === filters.bulan)?.label || 'Semua Bulan';

            // Process each date group
            laporan.data.forEach((dateGroup, groupIndex) => {
                if (groupIndex > 0 && startY > pageHeight - 100) {
                    addNewPage();
                }

                // Header untuk setiap tanggal
                doc.setFontSize(12);
                doc.setTextColor(40, 40, 40);
                doc.setFont(undefined, 'bold');
                doc.text(`LAPORAN PEMASUKAN - ${formatDate(dateGroup.fullDate).toUpperCase()}`, margin, startY);

                startY += 8;
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.setFont(undefined, 'normal');
                doc.text(`Filter: ${bulanTerpilih} - ${filters.dusun}`, margin, startY);
                startY += 5;
                doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, margin, startY);
                startY += 10;

                const headers = ['NO', 'DUSUN', 'MUZAKI', 'TETAP', 'TIDAK TETAP', 'TOTAL'];
                const tableData = dateGroup.dusunData.map((item, index) => [
                    (index + 1).toString(),
                    item.dusun,
                    `${item.jumlahMuzaki} Orang`,
                    formatCurrencyForExport(item.infaqTetap),
                    formatCurrencyForExport(item.infaqTidakTetap),
                    formatCurrencyForExport(item.total)
                ]);

                const colWidths = [10, 40, 20, 30, 30, 30];

                const drawTableBorders = (y, rowHeight) => {
                    let xPos = margin;
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.2);

                    colWidths.forEach((width) => {
                        doc.line(xPos, y, xPos, y + rowHeight);
                        xPos += width;
                    });
                    doc.rect(margin, y, xPos - margin, rowHeight);
                };

                // Header tabel
                doc.setFillColor(220, 38, 38);
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');

                let xPos = margin;
                headers.forEach((header, index) => {
                    doc.setFillColor(220, 38, 38);
                    doc.rect(xPos, startY, colWidths[index], lineHeight * 1.5, 'F');
                    xPos += colWidths[index];
                });

                xPos = margin;
                headers.forEach((header, index) => {
                    const textWidth = doc.getTextWidth(header);
                    const textX = xPos + (colWidths[index] - textWidth) / 2;
                    doc.text(header, textX, startY + lineHeight);
                    xPos += colWidths[index];
                });

                drawTableBorders(startY, lineHeight * 1.5);
                startY += lineHeight * 1.5;

                // Data rows untuk tanggal ini
                doc.setTextColor(0, 0, 0);
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);

                tableData.forEach((row, rowIndex) => {
                    if (startY > pageHeight - margin - lineHeight) {
                        addNewPage();

                        // Redraw header pada halaman baru
                        doc.setFillColor(220, 38, 38);
                        doc.setTextColor(255, 255, 255);
                        doc.setFont(undefined, 'bold');

                        xPos = margin;
                        headers.forEach((header, index) => {
                            doc.rect(xPos, startY, colWidths[index], lineHeight * 1.5, 'F');
                            const textWidth = doc.getTextWidth(header);
                            const textX = xPos + (colWidths[index] - textWidth) / 2;
                            doc.text(header, textX, startY + lineHeight);
                            xPos += colWidths[index];
                        });
                        drawTableBorders(startY, lineHeight * 1.5);
                        startY += lineHeight * 1.5;

                        doc.setTextColor(0, 0, 0);
                        doc.setFont(undefined, 'normal');
                    }

                    // Alternate row background
                    if (rowIndex % 2 === 0) {
                        doc.setFillColor(245, 245, 245);
                        doc.rect(margin, startY, 160, lineHeight * 1.2, 'F');
                    }

                    xPos = margin;
                    row.forEach((cell, cellIndex) => {
                        let displayText = cell.toString();
                        const maxWidth = colWidths[cellIndex] - 4;

                        // Truncate text if too long
                        if ((cellIndex === 1) && doc.getTextWidth(displayText) > maxWidth) {
                            while (doc.getTextWidth(displayText) > maxWidth && displayText.length > 10) {
                                displayText = displayText.substring(0, displayText.length - 1);
                            }
                            displayText = displayText + '...';
                        }

                        const textWidth = doc.getTextWidth(displayText);
                        const textX = xPos + (colWidths[cellIndex] - textWidth) / 2;
                        doc.text(displayText, textX, startY + lineHeight - 2);
                        xPos += colWidths[cellIndex];
                    });

                    drawTableBorders(startY, lineHeight * 1.2);
                    startY += lineHeight * 1.2;
                });

                // Ringkasan per tanggal
                startY += lineHeight;
                if (startY > pageHeight - margin - lineHeight * 8) {
                    addNewPage();
                    startY = margin + 10;
                }

                doc.setFont(undefined, 'bold');
                doc.setFontSize(9);
                doc.text(`RINGKASAN ${formatDateForGrouping(dateGroup.fullDate)}:`, margin, startY);
                startY += lineHeight;

                doc.setFont(undefined, 'normal');
                doc.text(`Total Dusun: ${dateGroup.dusunData.length}`, margin + 10, startY);
                startY += lineHeight;
                doc.text(`Total Muzaki: ${dateGroup.totals.totalMuzaki} Orang`, margin + 10, startY);
                startY += lineHeight;
                doc.text(`Total Infaq Tetap: ${formatCurrencyForExport(dateGroup.totals.totalInfaqTetap)}`, margin + 10, startY);
                startY += lineHeight;
                doc.text(`Total Infaq Tidak Tetap: ${formatCurrencyForExport(dateGroup.totals.totalInfaqTidakTetap)}`, margin + 10, startY);
                startY += lineHeight;
                doc.text(`Total Seluruh: ${formatCurrencyForExport(dateGroup.totals.totalSeluruh)}`, margin + 10, startY);

                // Space antara kelompok tanggal
                startY += lineHeight * 2;

                // Add new page if we're at the bottom and there are more groups
                if (groupIndex < laporan.data.length - 1 && startY > pageHeight - 100) {
                    addNewPage();
                }
            });

            // Overall summary on last page
            if (startY > pageHeight - margin - lineHeight * 10) {
                addNewPage();
                startY = margin + 10;
            }

            startY += 10;
            doc.setFont(undefined, 'bold');
            doc.setFontSize(12);
            doc.text('RINGKASAN KESELURUHAN', margin, startY);
            startY += lineHeight * 2;

            doc.setFontSize(10);
            doc.text(`Total Seluruh Tanggal: ${laporan.data.length} Hari`, margin, startY);
            startY += lineHeight;
            doc.text(`Total Muzaki: ${laporan.totals.totalMuzaki} Orang`, margin, startY);
            startY += lineHeight;
            doc.text(`Total Infaq Tetap: ${formatCurrencyForExport(laporan.totals.totalInfaqTetap)}`, margin, startY);
            startY += lineHeight;
            doc.text(`Total Infaq Tidak Tetap: ${formatCurrencyForExport(laporan.totals.totalInfaqTidakTetap)}`, margin, startY);
            startY += lineHeight;
            doc.text(`Total Seluruh: ${formatCurrencyForExport(laporan.totals.totalSeluruh)}`, margin, startY);

            startY += lineHeight * 2;
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('Laporan ini dicetak secara otomatis dari Sistem', margin, startY);

            const fileName = `Laporan_Pemasukan_Per_Tanggal_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Error saat mengekspor ke PDF: ' + error.message);
        } finally {
            setExportLoading(null);
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleDusunChange = (dusun) => {
        setFilters(prev => ({
            ...prev,
            dusun: dusun
        }));
    };

    useEffect(() => {
        if (filters.dusun && filters.dusun !== 'Semua Dusun') {
            const dusunExists = laporan.data.some(dateGroup =>
                dateGroup.dusunData.some(item => item.dusun === filters.dusun)
            );
            if (!dusunExists && laporan.data.length > 0) {
                setFilters(prev => ({
                    ...prev,
                    dusun: 'Semua Dusun'
                }));
            }
        }
    }, [laporan.data, filters.dusun]);

    useEffect(() => {
        fetchAllData();

        const pemasukanSubscription = supabase
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
                    fetchAllData();
                }
            )
            .subscribe();

        const dusunSubscription = supabase
            .channel('dusun-laporan-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dusun'
                },
                (payload) => {
                    console.log('Realtime change received for dusun:', payload);
                    fetchDusunList().then(data => setDusunList(data || []));
                }
            )
            .subscribe();

        return () => {
            pemasukanSubscription.unsubscribe();
            dusunSubscription.unsubscribe();
        };
    }, []);

    if (loading && pemasukanData.length === 0) {
        return (
            <Loading />
        );
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
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                            onClick={fetchAllData}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center transition-colors duration-200"
                        >
                            <FontAwesomeIcon icon={faRefresh} className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Refresh Data
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="mb-12 mx-4 sm:mx-6 lg:mx-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                            Laporan Keuangan
                        </h2>
                        <p className="text-slate-600 text-sm sm:text-base">
                            Ringkasan data pemasukan per tanggal
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

                {/* Export Section */}
                {laporan.data.length > 0 && (
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-3 sm:mb-0">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Export Laporan</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">Unduh laporan dalam format PDF</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={exportToPDF}
                                    disabled={exportLoading}
                                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium"
                                >
                                    {exportLoading === 'pdf' ? (
                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <FontAwesomeIcon icon={faFilePdf} className="h-3 w-3 sm:h-4 sm:w-4" />
                                    )}
                                    <span>PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Section */}
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-3 sm:mb-0">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Filter Laporan</h3>
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

                {/* Stats Cards */}
                {laporan.data.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg mr-2 sm:mr-3">
                                    <FontAwesomeIcon icon={faUsers} className="text-green-700 w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600">Total Muzaki</p>
                                    <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">{laporan.totals.totalMuzaki}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-2 sm:mr-3">
                                    <FontAwesomeIcon icon={faDonate} className="text-blue-700 w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600">Infaq Tetap</p>
                                    <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">
                                        {formatCurrency(laporan.totals.totalInfaqTetap)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="bg-purple-100 p-2 rounded-lg mr-2 sm:mr-3">
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-purple-700 w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600">Infaq Tidak Tetap</p>
                                    <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">
                                        {formatCurrency(laporan.totals.totalInfaqTidakTetap)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="bg-orange-100 p-2 rounded-lg mr-2 sm:mr-3">
                                    <FontAwesomeIcon icon={faRefresh} className="text-orange-700 w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600">Total Tanggal</p>
                                    <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">
                                        {laporan.data.length} Hari
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content - Grouped by Date */}
                {laporan.data.length === 0 ? (
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6 sm:p-8 text-center border border-green-200">
                        <div className="max-w-md mx-auto">
                            <FontAwesomeIcon icon={faChartBar} className="text-slate-300 text-3xl sm:text-4xl mb-4" />
                            <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-2">Belum ada data laporan</h3>
                            <p className="text-slate-500 text-xs sm:text-sm mb-6">
                                Tidak ada data yang sesuai dengan filter yang dipilih
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                                <button
                                    onClick={handleRefresh}
                                    className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center text-xs sm:text-sm transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faRefresh} className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                    Refresh Data
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {laporan.data.map((dateGroup, groupIndex) => (
                            <div key={groupIndex} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-green-200 overflow-hidden">
                                {/* Date Header */}
                                <div className="bg-green-50 border-b border-green-200 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-green-700 mr-2" />
                                            <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                                                {formatDate(dateGroup.fullDate)}
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Table for this date */}
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px]">
                                        <thead className="bg-green-50 border-b border-green-200">
                                            <tr>
                                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                                    Dusun
                                                </th>
                                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                                    Jumlah Muzaki
                                                </th>
                                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                                    Infaq Tetap
                                                </th>
                                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                                    Infaq Tidak Tetap
                                                </th>
                                                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-green-200">
                                            {dateGroup.dusunData.map((item, index) => (
                                                <tr key={index} className="hover:bg-green-50 transition-colors">
                                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 mr-2 text-slate-400" />
                                                            {item.dusun}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faUsers} className="w-3 h-3 mr-2 text-slate-400" />
                                                            {item.jumlahMuzaki} Orang
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-green-700">
                                                        {formatCurrency(item.infaqTetap)}
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-blue-700">
                                                        {formatCurrency(item.infaqTidakTetap)}
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-purple-700">
                                                        {formatCurrency(item.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-green-50 border-t border-green-200">
                                            <tr>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-800">
                                                    TOTAL
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-800">
                                                    {dateGroup.totals.totalMuzaki} Orang
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-green-700">
                                                    {formatCurrency(dateGroup.totals.totalInfaqTetap)}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-blue-700">
                                                    {formatCurrency(dateGroup.totals.totalInfaqTidakTetap)}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-purple-700">
                                                    {formatCurrency(dateGroup.totals.totalSeluruh)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {laporan.data.length > 0 && (
                    <div className="mt-4 sm:mt-6 bg-green-50 border border-green-300 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-green-800">
                                <FontAwesomeIcon icon={faRefresh} className="mr-2 text-sm" />
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
    );
};

export default Laporan;