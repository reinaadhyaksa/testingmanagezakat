const Hero = () => {
    return (
        <section id="home" className="relative bg-gradient-to-r from-green-800 to-green-900 text-white">
            <div className="absolute inset-0 bg-black opacity-30"></div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 relative z-10">
                <div className="max-w-2xl">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight sm:leading-snug">
                        Menebar Kebaikan, <span className="text-green-300">Memakmurkan Umat</span>
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-6 leading-relaxed">
                        Setiap Zakat Anda adalah Investasi Akhirat yang Penuh Berkah
                    </p>
                    <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed">
                        "Bersama kita wujudkan kepedulian, transparansi penuh dalam setiap amanah,
                        dan dampak nyata bagi mereka yang membutuhkan."
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <a
                            href="#kegiatan"
                            className="bg-white text-green-800 hover:bg-green-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center text-sm sm:text-base md:text-lg"
                        >
                            📊 Lihat Kegiatan Kami
                        </a>
                        <a
                            href="#"
                            className="bg-green-600 hover:bg-green-700 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-green-500 text-center text-sm sm:text-base md:text-lg"
                        >
                            💫 Salurkan Zakat Sekarang
                        </a>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-12 sm:h-16 bg-gradient-to-t from-green-900 to-transparent"></div>
        </section>
    )
}

export default Hero