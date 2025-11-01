import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync, faPlus, faEdit, faTrash, faExclamationTriangle, faRefresh, faCalendarAlt, faMapMarkerAlt, faUser, faDonate, faMoneyBillWave, faEye, faFileExcel, faFilePdf, faTimes } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { Loading } from '../Loading'
import { getLargeUrl } from '../../utils/cloudinaryOptimizer'
import OptimizedImage from '../OptimizedImage'

const Pemasukan = () => {
    const [pemasukanData, setPemasukanData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)
    const [exportLoading, setExportLoading] = useState(null)

    const navigate = useNavigate()

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

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchPemasukan()
    }

    const handleTambahPemasukan = () => {
        navigate('/pemasukan/tambah')
    }

    const handleEditPemasukan = (id) => {
        navigate(`/pemasukan/edit/${id}`)
    }

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

    const formatCurrencyForExport = (amount) => {
        const numericAmount = typeof amount === 'string'
            ? parseFloat(amount.replace(/[^\d]/g, ''))
            : amount

        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(numericAmount)
    }

    const getJenisBadgeColor = (jenis) => {
        switch (jenis) {
            case 'Zakat Fitrah':
                return 'bg-green-100 text-green-800 border-green-300'
            case 'Zakat Maal':
                return 'bg-blue-100 text-blue-800 border-blue-300'
            case 'Infaq':
                return 'bg-purple-100 text-purple-800 border-purple-300'
            case 'Sedekah':
                return 'bg-orange-100 text-orange-800 border-orange-300'
            default:
                return 'bg-slate-100 text-slate-800 border-slate-300'
        }
    }

    const exportToExcel = async () => {
        try {
            setExportLoading('excel')

            if (!pemasukanData || !Array.isArray(pemasukanData)) {
                throw new Error('Data pemasukan tidak tersedia atau bukan array')
            }
            if (pemasukanData.length === 0) {
                throw new Error('Tidak ada data untuk diekspor')
            }

            const XLSX = await import('xlsx-js-style')
            const totalJumlah = pemasukanData.reduce((sum, item) => {
                const amount = typeof item.jumlah === 'string'
                    ? parseFloat(item.jumlah.replace(/[^\d]/g, ''))
                    : item.jumlah;
                return sum + (amount || 0);
            }, 0);

            const wb = XLSX.utils.book_new()
            const excelData = []

            excelData.push(['', '', 'LAPORAN DATA PEMASUKAN'])
            excelData.push(['', '', 'Data Pemasukan Zakat, Infaq, dan Sedekah'])
            excelData.push([])
            excelData.push([])
            excelData.push(['', '', 'NO', 'NAMA', 'JUMLAH UANG', 'DUSUN', 'TANGGAL'])
            pemasukanData.forEach((item, index) => {
                excelData.push([
                    '', '',
                    index + 1,
                    item.muzaki || '-',
                    formatCurrencyForExport(item.jumlah || 0),
                    item.dusun || '-',
                    item.date || '-'
                ])
            })
            excelData.push([])
            excelData.push(['', '', 'RINGKASAN:'])
            excelData.push(['', '', `Total Data: ${pemasukanData.length}`])
            excelData.push(['', '', `Total Jumlah: ${formatCurrencyForExport(totalJumlah)}`])
            excelData.push([])
            const ws = XLSX.utils.aoa_to_sheet(excelData)
            const colWidths = [
                { wch: 2 },
                { wch: 2 },
                { wch: 8 },
                { wch: 35 },
                { wch: 20 },
                { wch: 18 },
                { wch: 15 }
            ]
            ws['!cols'] = colWidths
            const headerRowIndex = 7;
            const dataStartRow = 8;
            const dataEndRow = 7 + pemasukanData.length;
            const ringkasanStart = dataEndRow + 2;
            const footerRow = ringkasanStart + 4;
            ws['!merges'] = [
                { s: { r: 0, c: 2 }, e: { r: 0, c: 6 } },
                { s: { r: 1, c: 2 }, e: { r: 1, c: 6 } }
            ]

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
            ['C4', 'C5', 'C6'].forEach(cell => {
                if (ws[cell]) {
                    ws[cell].s = {
                        font: { sz: 8 },
                        alignment: { vertical: 'center', horizontal: 'center' }
                    }
                }
            })

            for (let C = 2; C < 7; C++) {
                const cell_ref = XLSX.utils.encode_cell({ c: C, r: headerRowIndex })
                if (ws[cell_ref]) {
                    ws[cell_ref].s = {
                        fill: { fgColor: { rgb: '2E8B57' } },
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

            for (let R = dataStartRow; R <= dataEndRow; R++) {
                const isEvenRow = (R - dataStartRow) % 2 === 1;

                for (let C = 2; C < 7; C++) {
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

            const ringkasanCell = XLSX.utils.encode_cell({ c: 2, r: ringkasanStart })
            if (ws[ringkasanCell]) {
                ws[ringkasanCell].s = {
                    font: { bold: true, sz: 8 },
                    alignment: { vertical: 'center', horizontal: 'center' }
                }
            }

            const ringkasanData = [ringkasanStart + 1, ringkasanStart + 2];
            ringkasanData.forEach(row => {
                const cell_ref = XLSX.utils.encode_cell({ c: 2, r: row })
                if (ws[cell_ref]) {
                    ws[cell_ref].s = {
                        font: { sz: 8 },
                        alignment: { vertical: 'center', horizontal: 'center' }
                    }
                }
            })

            const footerCell = XLSX.utils.encode_cell({ c: 2, r: footerRow })
            if (ws[footerCell]) {
                ws[footerCell].s = {
                    font: { sz: 7, color: { rgb: '969696' } },
                    alignment: { vertical: 'center', horizontal: 'center' }
                }
            }

            XLSX.utils.book_append_sheet(wb, ws, 'Data Pemasukan')
            const fileName = `Laporan_Pemasukan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`
            XLSX.writeFile(wb, fileName)


        } catch (error) {
            console.error('❌ Error exporting to Excel:', error)
            alert('Error saat mengekspor ke Excel: ' + error.message)
        } finally {
            setExportLoading(null)
        }
    }

    const exportToPDF = async () => {
        try {
            setExportLoading('pdf')
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.setTextColor(40, 40, 40);
            doc.setFont(undefined, 'bold');
            doc.text('LAPORAN DATA PEMASUKAN', 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'normal');
            doc.text('Data Pemasukan Zakat, Infaq, dan Sedekah', 105, 27, { align: 'center' });

            doc.setFontSize(8);
            doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 15, 35);
            doc.text(`Total Data: ${pemasukanData.length}`, 15, 40);

            const totalJumlah = pemasukanData.reduce((sum, item) => {
                const amount = typeof item.jumlah === 'string'
                    ? parseFloat(item.jumlah.replace(/[^\d]/g, ''))
                    : item.jumlah;
                return sum + (amount || 0);
            }, 0);

            doc.text(`Total Jumlah: ${formatCurrencyForExport(totalJumlah)}`, 15, 45);

            const headers = ['NO', 'NAMA', 'JUMLAH UANG', 'DUSUN', 'TANGGAL'];

            const tableData = pemasukanData.map((item, index) => [
                (index + 1).toString(),
                item.muzaki,
                formatCurrencyForExport(item.jumlah),
                item.dusun,
                item.date
            ]);

            let startY = 55;
            const lineHeight = 7;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 15;
            const colWidths = [15, 60, 45, 35, 30];

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
                doc.text('LAPORAN DATA PEMASUKAN (Lanjutan)', 105, 15, { align: 'center' });
                doc.setFontSize(8);
                doc.text(`Halaman ${doc.internal.getNumberOfPages()}`, 190, 25, { align: 'right' });
            };

            doc.setFillColor(46, 139, 87);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');

            let xPos = margin;
            headers.forEach((header, index) => {
                doc.setFillColor(46, 139, 87);
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

            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);

            tableData.forEach((row, rowIndex) => {
                if (startY > pageHeight - margin - lineHeight) {
                    addNewPage();

                    doc.setFillColor(46, 139, 87);
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

                if (rowIndex % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(margin, startY, 185, lineHeight * 1.2, 'F');
                }

                xPos = margin;
                row.forEach((cell, cellIndex) => {
                    let displayText = cell.toString();
                    const maxWidth = colWidths[cellIndex] - 4;

                    if (cellIndex === 1 && doc.getTextWidth(displayText) > maxWidth) {
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

            startY += lineHeight;
            if (startY > pageHeight - margin - lineHeight * 4) {
                addNewPage();
                startY = margin + 10;
            }

            doc.setFont(undefined, 'bold');
            doc.setFontSize(9);
            doc.text('RINGKASAN:', margin, startY);
            startY += lineHeight;

            doc.setFont(undefined, 'normal');
            doc.text(`Total Data: ${pemasukanData.length}`, margin + 10, startY);
            startY += lineHeight;
            doc.text(`Total Jumlah: ${formatCurrencyForExport(totalJumlah)}`, margin + 10, startY);

            startY += lineHeight * 2;
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('Laporan ini dicetak secara otomatis dari Sistem', margin, startY);

            const fileName = `Laporan Pemasukan.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Error saat mengekspor ke PDF: ' + error.message);
        } finally {
            setExportLoading(null);
        }
    }

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

    if (loading && pemasukanData.length === 0) {
        return <Loading />
    }

    if (error && pemasukanData.length === 0) {
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
                            onClick={fetchPemasukan}
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
        )
    }

    return (
        <>
            <section className="mb-12 mx-4 sm:mx-6 lg:mx-8">
                {selectedImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl max-h-full overflow-auto">
                            <div className="flex justify-between items-center p-4 border-b border-green-200">
                                <h3 className="text-lg font-semibold text-slate-800">Preview Dokumentasi</h3>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="text-slate-500 hover:text-slate-700"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
                                </button>
                            </div>
                            <OptimizedImage
                                src={selectedImage}
                                alt="Dokumentasi Preview"
                                className="w-full h-auto"
                                loading="eager"
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                            Manajemen Pemasukan
                        </h2>
                        <p className="text-slate-600 text-sm sm:text-base">
                            Kelola data pemasukan zakat, infaq, dan sedekah
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
                        <button
                            onClick={handleTambahPemasukan}
                            className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center transition-colors duration-200 shadow-sm font-medium text-xs sm:text-sm"
                        >
                            <FontAwesomeIcon icon={faPlus} className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Tambah Data
                        </button>
                    </div>
                </div>

                {pemasukanData.length > 0 && (
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-3 sm:mb-0">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Export Laporan</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">Unduh laporan dalam format Excel, PDF, atau Backup</p>
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

                {pemasukanData.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg mr-2 sm:mr-3">
                                    <FontAwesomeIcon icon={faDonate} className="text-green-700 w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600">Total Data</p>
                                    <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">{pemasukanData.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-2 sm:mr-3">
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-blue-700 w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600">Total Zakat Fitrah</p>
                                    <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">
                                        {pemasukanData
                                            .filter(item => item.jenis === 'Zakat Fitrah')
                                            .length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="bg-purple-100 p-2 rounded-lg mr-2 sm:mr-3">
                                    <FontAwesomeIcon icon={faDonate} className="text-purple-700 w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600">Total Infaq</p>
                                    <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">
                                        {pemasukanData
                                            .filter(item => item.jenis === 'Infaq')
                                            .length}
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

                {pemasukanData.length === 0 ? (
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6 sm:p-8 text-center border border-green-200">
                        <div className="max-w-md mx-auto">
                            <FontAwesomeIcon icon={faDonate} className="text-slate-300 text-3xl sm:text-4xl mb-4" />
                            <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-2">Belum ada data pemasukan</h3>
                            <p className="text-slate-500 text-xs sm:text-sm mb-6">
                                Mulai dengan menambahkan data pemasukan pertama Anda
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                                <button
                                    onClick={handleRefresh}
                                    className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center text-xs sm:text-sm transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faRefresh} className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                    Refresh Data
                                </button>
                                <button
                                    onClick={handleTambahPemasukan}
                                    className="bg-green-700 hover:bg-green-800 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors duration-200 font-medium"
                                >
                                    Tambah Data Pertama
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
                                            Tanggal
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Dusun
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Nama
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Jenis
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Jumlah
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Dokumentasi
                                        </th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-200">
                                    {pemasukanData.map((item, index) => (
                                        <tr key={item.id || index} className="hover:bg-green-50 transition-colors">
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-2 text-slate-400" />
                                                    {item.date}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 mr-2 text-slate-400" />
                                                    {item.dusun}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faUser} className="w-3 h-3 mr-2 text-slate-400" />
                                                    {item.muzaki}
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                <span className={`inline-flex items-center px-8 py-1 rounded-full text-xs font-medium border ${getJenisBadgeColor(item.jenis)}`}>
                                                    {item.jenis}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-green-700">
                                                {formatCurrency(item.jumlah)}
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                {item.dokumentasi ? (
                                                    <div className="flex items-center space-x-2">
                                                        <OptimizedImage
                                                            src={item.dokumentasi.gambar_url}
                                                            alt="Dokumentasi"
                                                            width={32}
                                                            height={32}
                                                            className="w-8 h-8 object-cover rounded border border-green-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => setSelectedImage(
                                                                getLargeUrl(item.dokumentasi.gambar_url)
                                                            )}
                                                            fallbackSrc={item.dokumentasi.gambar_url}
                                                        />
                                                        <button
                                                            onClick={() => setSelectedImage(
                                                                getLargeUrl(item.dokumentasi.gambar_url)
                                                            )}
                                                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} className="w-3 h-3 mr-1" />
                                                            Lihat
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 sm:px-4 py-2 sm:py-3">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditPemasukan(item.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center justify-center text-xs transition-colors duration-200"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleHapusPemasukan(item.id)}
                                                        disabled={deletingId === item.id}
                                                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white p-2 rounded-lg flex items-center justify-center text-xs transition-colors duration-200"
                                                    >
                                                        {deletingId === item.id ? (
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                        ) : (
                                                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {pemasukanData.length > 0 && (
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
    )
}

export default Pemasukan