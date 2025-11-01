import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
    faArrowRight,
    faCalendar
} from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect, useCallback } from 'react'
import { activityService } from "../../../utils/activityService"
import { Loading } from "../../Loading"

const Kegiatan = () => {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadActivities()
    }, [])

    const loadActivities = useCallback(async () => {
        try {
            setLoading(true)
            setError('')
            const data = await activityService.getAllActivities()
            setActivities(data)
        } catch (err) {
            setError('Gagal memuat data kegiatan')
            console.error('Error loading activities:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }, [])

    const truncateDescription = useCallback((description, maxLength = 120) => {
        if (!description) return ''
        if (description.length <= maxLength) return description
        return description.substring(0, maxLength) + '...'
    }, [])

    const handleImageError = useCallback((e) => {
        e.target.src = '/images/placeholder-activity.jpg'
        e.target.alt = 'Gambar tidak tersedia'
    }, [])

    if (loading) {
        return (
            <section id="kegiatan" className="py-8 sm:py-12 md:py-16 bg-green-50">
                <div className="container mx-auto px-4 sm:px-6">
                    <Loading />
                </div>
            </section>
        )
    }

    return (
        <section id="kegiatan" className="py-8 sm:py-12 md:py-16 bg-green-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">
                        Kegiatan Terkini
                    </h2>
                    <p className="text-slate-600 mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base">
                        Berbagai kegiatan sosial dan keagamaan yang telah kami lakukan untuk memberdayakan masyarakat
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 sm:mb-6 text-center max-w-2xl mx-auto text-sm sm:text-base">
                        <p>{error}</p>
                        <button
                            onClick={loadActivities}
                            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition duration-200 text-sm sm:text-base"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {activities.length === 0 && !loading ? (
                    <div className="text-center py-8 sm:py-12">
                        <div className="text-slate-400 text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">
                            <FontAwesomeIcon icon={faCalendar} />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-slate-600 mb-2">
                            Belum ada kegiatan
                        </h3>
                        <p className="text-slate-500 text-sm sm:text-base">
                            Tidak ada kegiatan yang ditampilkan saat ini
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-green-100 hover:border-green-300 cursor-pointer group"
                            >
                                <div className="h-40 sm:h-44 md:h-48 bg-green-100 overflow-hidden">
                                    <img
                                        src={activity.image_url}
                                        alt={activity.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        onError={handleImageError}
                                        loading="lazy"
                                    />
                                </div>

                                <div className="p-4 sm:p-5 md:p-6">
                                    <div className="flex items-center mb-2 sm:mb-3 text-slate-500 text-xs sm:text-sm">
                                        <FontAwesomeIcon
                                            icon={faCalendar}
                                            className="mr-2 w-3 sm:w-4"
                                        />
                                        <span>{formatDate(activity.created_at)}</span>
                                    </div>

                                    <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-3 line-clamp-2 group-hover:text-green-600 transition duration-200">
                                        {activity.title}
                                    </h3>

                                    <p className="text-slate-600 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                                        {truncateDescription(activity.description)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default Kegiatan