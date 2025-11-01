import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faHandsHelping,
    faBars,
    faTimes,
    faHome,
    faBullseye,
    faCalendarAlt,
    faChartLine,
    faComments,
    faPhone
} from '@fortawesome/free-solid-svg-icons'

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const navItems = [
        { href: "#home", label: "Beranda", icon: faHome },
        { href: "#visi", label: "Visi & Misi", icon: faBullseye },
        { href: "#kegiatan", label: "Kegiatan", icon: faCalendarAlt },
        { href: "#transparansi", label: "Transparansi", icon: faChartLine },
        { href: "#kontak", label: "Kontak", icon: faPhone }
    ]

    const closeMobileMenu = () => {
        setIsMenuOpen(false)
    }

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <FontAwesomeIcon
                        icon={faHandsHelping}
                        className="text-green-700 text-2xl sm:text-3xl mr-2 sm:mr-3"
                    />
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-green-800">
                        Zakat Amanah
                    </span>
                </div>

                <nav className="hidden md:flex space-x-2 lg:space-x-4 xl:space-x-6">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-slate-700 hover:text-green-700 font-medium transition duration-300 text-sm lg:text-base flex items-center hover:bg-green-50 px-3 py-2 rounded-lg"
                        >
                            <FontAwesomeIcon
                                icon={item.icon}
                                className="mr-2 text-sm text-green-600"
                            />
                            {item.label}
                        </a>
                    ))}
                </nav>

                <button
                    className="md:hidden text-slate-700 p-2 rounded-lg hover:bg-green-50 transition duration-300"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                >
                    <FontAwesomeIcon
                        icon={isMenuOpen ? faTimes : faBars}
                        className="text-xl sm:text-2xl"
                    />
                </button>
            </div>

            <div className={`md:hidden bg-white transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <nav className="flex flex-col space-y-1 px-4 sm:px-6 pb-4 sm:pb-6">
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-slate-700 hover:text-green-700 font-medium py-3 px-4 rounded-lg hover:bg-green-50 transition duration-300 border-b border-green-100 last:border-b-0 flex items-center text-base sm:text-lg"
                            onClick={closeMobileMenu}
                        >
                            <FontAwesomeIcon
                                icon={item.icon}
                                className="mr-3 text-base sm:text-lg text-green-600"
                            />
                            {item.label}
                        </a>
                    ))}
                </nav>
            </div>
        </header>
    )
}

export default Header