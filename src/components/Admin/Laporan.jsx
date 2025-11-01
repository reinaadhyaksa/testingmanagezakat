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

            dusunMap[dusun].muzaki.add(item.muzaki);

            const jumlah = parseCurrency(item.jumlah);

            if (item.jenisinfaq === 'tetap') {
                dusunMap[dusun].infaqTetap += jumlah;
            } else if (item.jenisinfaq === 'tidak tetap') {
                dusunMap[dusun].infaqTidakTetap += jumlah;
            }

            dusunMap[dusun].total += jumlah;
        });

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

    // Fungsi Export ke Excel
    const exportToExcel = async () => {
        try {
            setExportLoading('excel');

            if (!laporan.data || !Array.isArray(laporan.data)) {
                throw new Error('Data laporan tidak tersedia atau bukan array')
            }
            if (laporan.data.length === 0) {
                throw new Error('Tidak ada data untuk diekspor')
            }

            const XLSX = await import('xlsx-js-style')
            const wb = XLSX.utils.book_new()
            const excelData = []

            // Header Laporan
            excelData.push(['', '', 'LAPORAN DATA PEMASUKAN PER DUSUN'])
            excelData.push(['', '', 'Data Pemasukan Zakat, Infaq, dan Sedekah'])

            // Info Filter
            const bulanTerpilih = listBulan.find(b => b.value === filters.bulan)?.label || 'Semua Bulan'
            excelData.push(['', '', `Filter: ${bulanTerpilih} - ${filters.dusun}`])
            excelData.push([])
            excelData.push([])

            // Header Tabel
            excelData.push(['', '', 'NO', 'DUSUN', 'JUMLAH MUZAKI', 'INFAQ TETAP', 'INFAQ TIDAK TETAP', 'TOTAL'])

            // Data
            laporan.data.forEach((item, index) => {
                excelData.push([
                    '', '',
                    index + 1,
                    item.dusun || '-',
                    `${item.jumlahMuzaki} Orang`,
                    formatCurrencyForExport(item.infaqTetap || 0),
                    formatCurrencyForExport(item.infaqTidakTetap || 0),
                    formatCurrencyForExport(item.total || 0)
                ])
            })

            // Footer dengan ringkasan
            excelData.push([])
            excelData.push(['', '', 'RINGKASAN:'])
            excelData.push(['', '', `Total Dusun: ${laporan.data.length}`])
            excelData.push(['', '', `Total Muzaki: ${laporan.totals.totalMuzaki} Orang`])
            excelData.push(['', '', `Total Infaq Tetap: ${formatCurrencyForExport(laporan.totals.totalInfaqTetap)}`])
            excelData.push(['', '', `Total Infaq Tidak Tetap: ${formatCurrencyForExport(laporan.totals.totalInfaqTidakTetap)}`])
            excelData.push(['', '', `Total Seluruh: ${formatCurrencyForExport(laporan.totals.totalSeluruh)}`])
            excelData.push([])

            const ws = XLSX.utils.aoa_to_sheet(excelData)
            const colWidths = [
                { wch: 2 },
                { wch: 2 },
                { wch: 8 },
                { wch: 25 },
                { wch: 15 },
                { wch: 20 },
                { wch: 20 },
                { wch: 20 }
            ]
            ws['!cols'] = colWidths

            // Merge cells untuk header
            ws['!merges'] = [
                { s: { r: 0, c: 2 }, e: { r: 0, c: 7 } },
                { s: { r: 1, c: 2 }, e: { r: 1, c: 7 } },
                { s: { r: 2, c: 2 }, e: { r: 2, c: 7 } }
            ]

            // Styling header utama
            if (ws['C1']) {
                ws['C1'].s = {
                    font: { bold: true, sz: 16, color: { rgb: '282828' } },
                    alignment: { vertical: 'center', horizontal: 'center' }
                }
            }
            if (ws['C2']) {
                ws['C2'].s = {
                    font: { sz: 10, color: { rgb: '646464' } },
                    alignment: { vertical: 'center', horizontal: 'center' }
                }
            }
            if (ws['C3']) {
                ws['C3'].s = {
                    font: { sz: 9, color: { rgb: '646464' } },
                    alignment: { vertical: 'center', horizontal: 'center' }
                }
            }

            // Styling header tabel (baris 5)
            const headerRowIndex = 5;
            for (let C = 2; C < 8; C++) {
                const cell_ref = XLSX.utils.encode_cell({ c: C, r: headerRowIndex })
                if (ws[cell_ref]) {
                    ws[cell_ref].s = {
                        fill: { fgColor: { rgb: 'DC2626' } },
                        font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 9 },
                        alignment: { vertical: 'center', horizontal: 'center' },
                        border: {
                            top: { style: 'thin', color: { rgb: '000000' } },
                            left: { style: 'thin', color: { rgb: '000000' } },
                            bottom: { style: 'thin', color: { rgb: '000000' } },
                            right: { style: 'thin', color: { rgb: '000000' } }
                        }
                    }
                }
            }

            // Styling data rows
            const dataStartRow = 6;
            const dataEndRow = 5 + laporan.data.length;
            for (let R = dataStartRow; R <= dataEndRow; R++) {
                const isEvenRow = (R - dataStartRow) % 2 === 1;

                for (let C = 2; C < 8; C++) {
                    const cell_ref = XLSX.utils.encode_cell({ c: C, r: R })
                    if (ws[cell_ref]) {
                        ws[cell_ref].s = {
                            fill: isEvenRow ? { fgColor: { rgb: 'F5F5F5' } } : { fgColor: { rgb: 'FFFFFF' } },
                            font: { sz: 8 },
                            alignment: { vertical: 'center', horizontal: 'center' },
                            border: {
                                top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                                left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                                bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                                right: { style: 'thin', color: { rgb: 'CCCCCC' } }
                            }
                        }
                    }
                }
            }

            // Styling ringkasan
            const ringkasanStart = dataEndRow + 2;
            for (let i = 0; i <= 5; i++) {
                const cell_ref = XLSX.utils.encode_cell({ c: 2, r: ringkasanStart + i })
                if (ws[cell_ref]) {
                    ws[cell_ref].s = {
                        font: { sz: 8, bold: i === 0 },
                        alignment: { vertical: 'center', horizontal: 'center' }
                    }
                }
            }

            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pemasukan')
            const fileName = `Laporan_Pemasukan_Per_Dusun_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`
            XLSX.writeFile(wb, fileName)

        } catch (error) {
            console.error('❌ Error exporting to Excel:', error)
            alert('Error saat mengekspor ke Excel: ' + error.message)
        } finally {
            setExportLoading(null)
        }
    }

    // Fungsi Export ke PDF
    const exportToPDF = async () => {
        try {
            setExportLoading('pdf')
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Header
            doc.setFontSize(16);
            doc.setTextColor(40, 40, 40);
            doc.setFont(undefined, 'bold');
            doc.text('LAPORAN DATA PEMASUKAN PER DUSUN', 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'normal');
            doc.text('Data Pemasukan Zakat, Infaq, dan Sedekah', 105, 27, { align: 'center' });

            // Info Filter
            const bulanTerpilih = listBulan.find(b => b.value === filters.bulan)?.label || 'Semua Bulan'
            doc.setFontSize(8);
            doc.text(`Filter: ${bulanTerpilih} - ${filters.dusun}`, 15, 35);
            doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 15, 40);
            doc.text(`Total Dusun: ${laporan.data.length}`, 15, 45);
            doc.text(`Total Muzaki: ${laporan.totals.totalMuzaki} Orang`, 15, 50);

            const headers = ['NO', 'DUSUN', 'MUZAKI', 'INFAQ TETAP', 'INFAQ TIDAK TETAP', 'TOTAL'];

            const tableData = laporan.data.map((item, index) => [
                (index + 1).toString(),
                item.dusun,
                `${item.jumlahMuzaki} Orang`,
                formatCurrencyForExport(item.infaqTetap),
                formatCurrencyForExport(item.infaqTidakTetap),
                formatCurrencyForExport(item.total)
            ]);

            let startY = 60;
            const lineHeight = 7;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 15;
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

            const addNewPage = () => {
                doc.addPage();
                startY = margin;

                doc.setFontSize(12);
                doc.setTextColor(100, 100, 100);
                doc.text('LAPORAN DATA PEMASUKAN PER DUSUN (Lanjutan)', 105, 15, { align: 'center' });
                doc.setFontSize(8);
                doc.text(`Halaman ${doc.internal.getNumberOfPages()}`, 190, 25, { align: 'right' });
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

            // Data rows
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

            // Ringkasan
            startY += lineHeight;
            if (startY > pageHeight - margin - lineHeight * 8) {
                addNewPage();
                startY = margin + 10;
            }

            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.text('RINGKASAN:', margin, startY);
            startY += lineHeight;

            doc.setFont(undefined, 'normal');
            doc.text(`Total Dusun: ${laporan.data.length}`, margin + 10, startY);
            startY += lineHeight;
            doc.text(`Total Muzaki: ${laporan.totals.totalMuzaki} Orang`, margin + 10, startY);
            startY += lineHeight;
            doc.text(`Total Infaq Tetap: ${formatCurrencyForExport(laporan.totals.totalInfaqTetap)}`, margin + 10, startY);
            startY += lineHeight;
            doc.text(`Total Infaq Tidak Tetap: ${formatCurrencyForExport(laporan.totals.totalInfaqTidakTetap)}`, margin + 10, startY);
            startY += lineHeight;
            doc.text(`Total Seluruh: ${formatCurrencyForExport(laporan.totals.totalSeluruh)}`, margin + 10, startY);

            startY += lineHeight * 2;
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('Laporan ini dicetak secara otomatis dari Sistem', margin, startY);

            const fileName = `Laporan_Pemasukan_Per_Dusun_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`;
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
            const dusunExists = laporan.data.some(item => item.dusun === filters.dusun);
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
                            Ringkasan data pemasukan per dusun
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
                                <p className="text-slate-600 text-xs sm:text-sm">Unduh laporan dalam format Excel atau PDF</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={exportToExcel}
                                    disabled={exportLoading}
                                    className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium"
                                >
                                    {exportLoading === 'excel' ? (
                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <FontAwesomeIcon icon={faFileExcel} className="h-3 w-3 sm:h-4 sm:w-4" />
                                    )}
                                    <span>Excel</span>
                                </button>
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
                                    <p className="text-xs sm:text-sm text-slate-600">Terakhir Update</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                                        {new Date().toLocaleTimeString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table */}
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
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-green-200 overflow-hidden">
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
                                    {laporan.data.map((item, index) => (
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
                                            {laporan.totals.totalMuzaki} Orang
                                        </td>
                                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-green-700">
                                            {formatCurrency(laporan.totals.totalInfaqTetap)}
                                        </td>
                                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-blue-700">
                                            {formatCurrency(laporan.totals.totalInfaqTidakTetap)}
                                        </td>
                                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-purple-700">
                                            {formatCurrency(laporan.totals.totalSeluruh)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
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