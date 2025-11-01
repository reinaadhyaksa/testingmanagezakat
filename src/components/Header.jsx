import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faChartLine,
    faMoneyBillTrendUp,
    faMoneyBillTransfer,
    faFileLines,
    faBars,
    faHandHoldingDollar,
    faXmark,
    faGear,
    faHome,
} from '@fortawesome/free-solid-svg-icons'
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'

const Header = () => {
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navItems = [
        {
            id: 'beranda',
            label: 'Beranda',
            path: '/beranda',
            icon: faHome
        },
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
        },
        {
            id: 'kegiatan',
            label: 'Kegiatan',
            path: '/kegiatan',
            icon: faCalendarDays
        },
        {
            id: 'pengaturan',
            label: 'Pengaturan',
            path: '/pengaturan',
            icon: faGear
        }
    ]

    const isActive = (path) => {
        return location.pathname === path ||
            (path === '/dashboard' && location.pathname === '/')
    }

    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location])

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isMobileMenuOpen])

    return (
        <>
            <header className="bg-white shadow-sm border-b border-green-200 fixed top-0 left-0 right-0 z-50 h-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex items-center">
                            <Link to="/dashboard" className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-700 rounded-lg flex items-center justify-center shadow-sm">
                                    <FontAwesomeIcon
                                        icon={faHandHoldingDollar}
                                        className="text-white text-lg"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800">SMZI</h1>
                                    <p className="text-xs text-slate-600 hidden sm:block">Finance Manager</p>
                                </div>
                            </Link>
                        </div>

                        <nav className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive(item.path)
                                        ? 'bg-green-50 text-green-800 font-medium border border-green-300'
                                        : 'text-slate-600 hover:text-green-800 hover:bg-green-50'
                                        }`}
                                >
                                    <FontAwesomeIcon
                                        icon={item.icon}
                                        className={isActive(item.path) ? "text-green-700" : "text-slate-500"}
                                        size="sm"
                                    />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            ))}
                        </nav>

                        <div className="hidden md:flex items-center space-x-4">
                            <div className="text-sm text-slate-600">
                                Admin Panel
                            </div>
                        </div>

                        <button
                            className="md:hidden text-slate-600 hover:text-green-700 transition-colors p-2"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
                        >
                            <FontAwesomeIcon
                                icon={isMobileMenuOpen ? faXmark : faBars}
                                className="h-6 w-6"
                            />
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-white z-40 overflow-y-auto">
                        <nav className="px-4 py-3">
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={item.path}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                            ? 'bg-green-50 text-green-800 font-medium border border-green-300'
                                            : 'text-slate-600 hover:text-green-800 hover:bg-green-50'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <FontAwesomeIcon
                                            icon={item.icon}
                                            className={isActive(item.path) ? "text-green-700" : "text-slate-500"}
                                            size="sm"
                                        />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            <div className="h-16"></div>
        </>
    )
}

export default Header