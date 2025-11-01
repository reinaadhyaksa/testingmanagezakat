const Footer = () => {
    const programLinks = [
        "Zakat Fitrah",
        "Zakat Mal",
        "Santunan Anak Yatim",
        "Bantuan Pendidikan",
        "Renovasi Masjid"
    ]

    return (
        <footer id="kontak" className="bg-green-900 text-white pt-8 sm:pt-12 pb-6 sm:pb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
                    <div>
                        <div className="flex items-center mb-3 sm:mb-4">
                            <i className="fas fa-hands-helping text-green-300 text-xl sm:text-2xl mr-2"></i>
                            <span className="text-lg sm:text-xl font-bold">Zakat Amanah</span>
                        </div>
                        <p className="text-green-200 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                            Lembaga zakat yang mengedepankan transparansi dan amanah dalam menyalurkan zakat, infak, dan sedekah.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Program Kami</h3>
                        <ul className="space-y-1 sm:space-y-2 text-green-200">
                            {programLinks.map((program, index) => (
                                <li key={index}>
                                    <div className="hover:text-white transition duration-300 text-sm sm:text-base">
                                        {program}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="pt-6 sm:pt-8 border-t border-green-700 text-center text-green-300">
                    <p className="text-xs sm:text-sm">&copy; 2025 Zakat Amanah. Semua Hak Dilindungi.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer