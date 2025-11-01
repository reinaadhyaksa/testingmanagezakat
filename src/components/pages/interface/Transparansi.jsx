import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faMapMarkerAlt,
    faUsers,
    faArrowUp,
    faArrowDown,
    faBalanceScale,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../../../utils/supabase'

const Transparansi = () => {
    const [dataPerDusun, setDataPerDusun] = useState([])
    const [totalTerkumpul, setTotalTerkumpul] = useState(0)
    const [totalDisalurkan, setTotalDisalurkan] = useState(0)
    const [loading, setLoading] = useState(true)

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const parseJumlah = (jumlah) => {
        if (typeof jumlah === 'number') return jumlah
        if (typeof jumlah === 'string') {
            // Remove any non-digit characters except decimal point
            const cleaned = jumlah.replace(/[^\d]/g, '')
            return parseFloat(cleaned) || 0
        }
        return 0
    }

    const fetchDataPerDusun = async () => {
        try {
            setLoading(true)

            // Fetch semua dusun yang ada
            const { data: dusunData, error: dusunError } = await supabase
                .from('dusun')
                .select('nama')
                .order('nama', { ascending: true })

            if (dusunError) throw dusunError

            // Fetch data pemasukan
            const { data: pemasukanData, error: pemasukanError } = await supabase
                .from('pemasukanomcar')
                .select('dusun, jumlah')
                .order('dusun', { ascending: true })

            if (pemasukanError) throw pemasukanError

            // Fetch data pengeluaran
            const { data: pengeluaranData, error: pengeluaranError } = await supabase
                .from('pengeluaranomcar')
                .select('dusun, jumlah')
                .order('dusun', { ascending: true })

            if (pengeluaranError) throw pengeluaranError

            // Inisialisasi map untuk semua dusun
            const dusunMap = new Map()

            // Tambahkan semua dusun ke map dengan nilai awal 0
            dusunData.forEach(dusun => {
                dusunMap.set(dusun.nama, {
                    pemasukan: 0,
                    pengeluaran: 0,
                    saldo: 0
                })
            })

            // Proses data pemasukan
            pemasukanData.forEach(item => {
                if (item.dusun) {
                    const currentData = dusunMap.get(item.dusun) || { pemasukan: 0, pengeluaran: 0, saldo: 0 }
                    const jumlah = parseJumlah(item.jumlah)

                    dusunMap.set(item.dusun, {
                        ...currentData,
                        pemasukan: currentData.pemasukan + jumlah
                    })
                }
            })

            // Proses data pengeluaran
            pengeluaranData.forEach(item => {
                if (item.dusun) {
                    const currentData = dusunMap.get(item.dusun) || { pemasukan: 0, pengeluaran: 0, saldo: 0 }
                    const jumlah = parseJumlah(item.jumlah)

                    dusunMap.set(item.dusun, {
                        ...currentData,
                        pengeluaran: currentData.pengeluaran + jumlah
                    })
                }
            })

            // Hitung saldo untuk setiap dusun
            let totalPemasukan = 0
            let totalPengeluaran = 0

            const dusunArray = Array.from(dusunMap, ([dusun, data]) => {
                const saldo = data.pemasukan - data.pengeluaran
                totalPemasukan += data.pemasukan
                totalPengeluaran += data.pengeluaran

                return {
                    dusun,
                    pemasukan: data.pemasukan,
                    pengeluaran: data.pengeluaran,
                    saldo
                }
            }).filter(item => item.pemasukan > 0 || item.pengeluaran > 0) // Hanya tampilkan dusun yang ada transaksinya
                .sort((a, b) => b.pemasukan - a.pemasukan) // Urutkan berdasarkan pemasukan tertinggi

            setDataPerDusun(dusunArray)
            setTotalTerkumpul(totalPemasukan)
            setTotalDisalurkan(totalPengeluaran)

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDataPerDusun()
    }, [])

    const totalSaldo = totalTerkumpul - totalDisalurkan

    const getSaldoColor = (saldo) => {
        if (saldo > 0) return 'text-green-700'
        if (saldo < 0) return 'text-red-700'
        return 'text-yellow-700'
    }

    const getSaldoBgColor = (saldo) => {
        if (saldo > 0) return 'bg-green-50 border-green-200'
        if (saldo < 0) return 'bg-red-50 border-red-200'
        return 'bg-yellow-50 border-yellow-200'
    }

    return (
        <section className="mx-4 sm:mx-6 lg:mx-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                    Transparansi Per Dusun
                </h2>
                <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                    Ringkasan keuangan per dusun - Pemasukan dan penyaluran dana berdasarkan dusun
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-2 sm:p-3 rounded-lg mr-3">
                            <FontAwesomeIcon icon={faArrowUp} className="text-green-600 w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-slate-600">Total Pemasukan</p>
                            <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">
                                {loading ? 'Loading...' : formatCurrency(totalTerkumpul)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-red-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="bg-red-100 p-2 sm:p-3 rounded-lg mr-3">
                            <FontAwesomeIcon icon={faArrowDown} className="text-red-600 w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-slate-600">Total Pengeluaran</p>
                            <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800">
                                {loading ? 'Loading...' : formatCurrency(totalDisalurkan)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className={`bg-white rounded-lg p-3 sm:p-4 border shadow-sm ${getSaldoBgColor(totalSaldo)}`}>
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-2 sm:p-3 rounded-lg mr-3">
                            <FontAwesomeIcon icon={faBalanceScale} className="text-blue-600 w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-slate-600">Saldo Total</p>
                            <p className={`text-base sm:text-lg md:text-xl font-bold ${getSaldoColor(totalSaldo)}`}>
                                {loading ? 'Loading...' : formatCurrency(totalSaldo)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-slate-600 mr-2 text-sm sm:text-base" />
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800">
                            Ringkasan Keuangan Per Dusun
                        </h3>
                    </div>
                </div>

                {loading ? (
                    <div className="p-6 sm:p-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-3 sm:mt-4 text-slate-500 text-xs sm:text-sm">Memuat data per dusun...</p>
                    </div>
                ) : dataPerDusun.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-slate-300 text-2xl sm:text-3xl mb-2" />
                        <p className="text-slate-500 text-xs sm:text-sm mb-3">Belum ada data keuangan per dusun</p>
                        <p className="text-slate-400 text-xs">Data akan muncul setelah ada transaksi pemasukan atau pengeluaran</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Dusun
                                    </th>
                                    <th className="px-3 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Pemasukan
                                    </th>
                                    <th className="px-3 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Pengeluaran
                                    </th>
                                    <th className="px-3 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        Saldo
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {dataPerDusun.map((item, index) => (
                                    <tr key={item.dusun} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-3">
                                            <div className="flex items-center">
                                                <div className="bg-slate-100 p-2 rounded-lg mr-3">
                                                    <FontAwesomeIcon icon={faUsers} className="text-slate-600 w-3 h-3 sm:w-4 sm:h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{item.dusun}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-semibold text-green-700">
                                                    {formatCurrency(item.pemasukan)}
                                                </span>
                                                {totalTerkumpul > 0 && (
                                                    <span className="text-xs text-slate-500 mt-1">
                                                        {((item.pemasukan / totalTerkumpul) * 100).toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-semibold text-red-700">
                                                    {formatCurrency(item.pengeluaran)}
                                                </span>
                                                {item.pemasukan > 0 && (
                                                    <span className="text-xs text-slate-500 mt-1">
                                                        {((item.pengeluaran / item.pemasukan) * 100).toFixed(1)}% dari pemasukan
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-bold ${getSaldoColor(item.saldo)}`}>
                                                    {formatCurrency(item.saldo)}
                                                </span>
                                                {item.pemasukan > 0 && (
                                                    <span className={`text-xs mt-1 ${getSaldoColor(item.saldo)}`}>
                                                        {((item.saldo / item.pemasukan) * 100).toFixed(1)}% dari pemasukan
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                                <tr>
                                    <td className="px-3 py-3 text-sm font-semibold text-slate-800">
                                        TOTAL SEMUA DUSUN
                                    </td>
                                    <td className="px-3 py-3 text-sm font-semibold text-slate-800 text-right">
                                        {formatCurrency(totalTerkumpul)}
                                    </td>
                                    <td className="px-3 py-3 text-sm font-semibold text-slate-800 text-right">
                                        {formatCurrency(totalDisalurkan)}
                                    </td>
                                    <td className="px-3 py-3 text-sm font-semibold text-slate-800 text-right">
                                        <span className={getSaldoColor(totalSaldo)}>
                                            {formatCurrency(totalSaldo)}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Transparansi