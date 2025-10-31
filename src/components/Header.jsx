import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faChartLine,
    faMoneyBillTrendUp,
    faMoneyBillTransfer,
    faFileLines,
    faBars,
    faHandHoldingDollar,
    faXmark
} from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'

const Header = () => {
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/dashboard',
            icon: faChartLine
        },
        {
            id: 'pemasukan',
            label: 'Pemasukan',
            path: '/pemasukan',
            icon: faMoneyBillTrendUp
        },
        {
            id: 'pengeluaran',
            label: 'Pengeluaran',
            path: '/pengeluaran',
            icon: faMoneyBillTransfer
        },
        {
            id: 'laporan',
            label: 'Laporan',
            path: '/laporan',
            icon: faFileLines
        }
    ]

    const isActive = (path) => {
        return location.pathname === path ||
            (path === '/dashboard' && location.pathname === '/')
    }

    // Tutup menu mobile saat berpindah halaman
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location])

    // Tutup menu mobile saat menekan tombol escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false)
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    // Cegah scroll body saat menu mobile terbuka
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
    }, [isMobileMenuOpen])

    return (
        <header className="bg-white shadow-sm border-b border-green-100 relative z-10">
            <div className="container mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <Link to="/" className="flex items-center">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-700 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-sm">
                            <FontAwesomeIcon
                                icon={faHandHoldingDollar}
                                className="text-white text-sm sm:text-base md:text-lg"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
                                Sistem Manajemen Zakat & Infaq
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                                SMZI - Transparan & Efisien
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:block">
                    <ul className="flex space-x-3 lg:space-x-4 xl:space-x-6">
                        {navItems.map((item) => (
                            <li key={item.id}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${isActive(item.path)
                                        ? 'text-green-700 font-medium bg-green-50 border border-green-200'
                                        : 'text-slate-600 hover:text-green-700 hover:bg-green-50'
                                        }`}
                                >
                                    <FontAwesomeIcon
                                        icon={item.icon}
                                        className={isActive(item.path) ? "text-green-700" : "text-slate-500"}
                                        size="sm"
                                    />
                                    <span className="text-sm lg:text-base">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-slate-600 hover:text-green-700 transition-colors p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
                >
                    <FontAwesomeIcon
                        icon={isMobileMenuOpen ? faXmark : faBars}
                        className="h-5 w-5 sm:h-6 sm:w-6"
                    />
                </button>
            </div>

            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            {/* Mobile Navigation Menu - Dari Sisi Kiri */}
            <div className={`md:hidden fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Header Menu Mobile */}
                <div className="p-4 sm:p-5 border-b border-green-100 flex justify-between items-center bg-green-50">
                    <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-green-700 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                            <FontAwesomeIcon
                                icon={faHandHoldingDollar}
                                className="text-white text-sm sm:text-base"
                            />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-slate-800">SMZI</h2>
                            <p className="text-xs sm:text-sm text-slate-500">Menu Navigasi</p>
                        </div>
                    </div>
                    <button
                        className="text-slate-600 hover:text-green-700 transition-colors p-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Tutup menu"
                    >
                        <FontAwesomeIcon icon={faXmark} className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="p-4 sm:p-5">
                    <ul className="space-y-2 sm:space-y-3">
                        {navItems.map((item) => (
                            <li key={item.id}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                                        ? 'text-green-700 font-medium bg-green-50 border border-green-200 shadow-sm'
                                        : 'text-slate-600 hover:text-green-700 hover:bg-green-50 hover:shadow-sm'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FontAwesomeIcon
                                        icon={item.icon}
                                        className={isActive(item.path) ? "text-green-700" : "text-slate-500"}
                                        size="sm"
                                    />
                                    <span className="text-sm sm:text-base font-medium">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer Menu Mobile */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 border-t border-green-100 bg-white">
                    <p className="text-xs sm:text-sm text-slate-500 text-center">
                        SMZI - Transparan & Efisien
                    </p>
                </div>
            </div>
        </header>
    )
}

export default Header