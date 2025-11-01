import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBullseye,
    faHandshake,
    faSeedling,
    faHeart,
    faChartLine,
    faUsers
} from '@fortawesome/free-solid-svg-icons'

const VisiMisi = () => {
    const items = [
        {
            icon: faBullseye,
            title: "Transparan & Terpercaya",
            description: "Komitmen kami dalam mengelola dana zakat dengan akuntabilitas penuh dan laporan yang dapat diakses publik, menjadikan setiap rupiah amanah Anda terjaga dengan baik.",
            tagline: "Setiap Donasi Terpantau, Setiap Laporan Terbuka"
        },
        {
            icon: faHandshake,
            title: "Tepat Sasaran",
            description: "Memastikan bantuan sampai kepada yang benar-benar membutuhkan melalui verifikasi ketat dan pendataan yang komprehensif, karena kepercayaan Anda adalah tanggung jawab kami.",
            tagline: "Dari Hati, Untuk Mereka yang Berhak"
        },
        {
            icon: faSeedling,
            title: "Pemberdayaan Berkelanjutan",
            description: "Tidak hanya sekadar memberi, tapi memberdayakan. Menciptakan program berkelanjutan yang mengubah mustahik menjadi muzakki, membangun kemandirian ekonomi umat.",
            tagline: "Dari Penerima Menjadi Pemberi"
        },
        {
            icon: faHeart,
            title: "Dari Hati untuk Umat",
            description: "Mengelola zakat dengan ketulusan dan kasih sayang, karena kami percaya setiap kebaikan akan kembali dengan berlipat ganda.",
            tagline: "Ibadah dengan Cinta"
        },
        {
            icon: faChartLine,
            title: "Dampak yang Terukur",
            description: "Setiap program dirancang dengan indikator keberhasilan yang jelas, memastikan zakat Anda memberikan perubahan nyata dalam kehidupan.",
            tagline: "Bukti, Bukan Sekadar Janji"
        },
        {
            icon: faUsers,
            title: "Kolaborasi untuk Kebaikan",
            description: "Bersama-sama membangun sinergi dengan berbagai pihak untuk memperluas dampak positif dan menjangkau lebih banyak penerima manfaat.",
            tagline: "Bersama Lebih Berdampak"
        }
    ]

    return (
        <section id="visi" className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-green-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-3 sm:mb-4">
                        Visi & Misi Kebaikan Kami
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        "Menjadi jembatan kebaikan yang menghubungkan kepedulian Anda dengan harapan mereka yang membutuhkan,
                        dengan prinsip amanah dan transparansi dalam setiap langkah."
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100 hover:border-green-300 group hover:-translate-y-1 sm:hover:-translate-y-2"
                        >
                            <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-105 sm:group-hover:scale-110 transition-transform duration-300">
                                <FontAwesomeIcon
                                    icon={item.icon}
                                    className="text-white text-xl sm:text-2xl"
                                />
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-3 sm:mb-4 text-center">
                                {item.title}
                            </h3>
                            <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4 text-center leading-relaxed">
                                {item.description}
                            </p>
                            <div className="text-center">
                                <span className="inline-block bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                                    {item.tagline}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 sm:mt-16 bg-green-800 text-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Visi Kami</h3>
                    <p className="text-base sm:text-lg md:text-xl italic leading-relaxed">
                        "Menjadi lembaga zakat terdepan yang mewujudkan masyarakat sejahtera
                        melalui pengelolaan dana yang transparan, profesional, dan berkelanjutan"
                    </p>
                </div>
            </div>
        </section>
    )
}

export default VisiMisi