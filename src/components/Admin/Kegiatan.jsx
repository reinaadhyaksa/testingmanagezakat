// src/components/Admin/Kegiatan.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPlus,
    faEdit,
    faTrash,
    faCalendarAlt,
    faImage
} from '@fortawesome/free-solid-svg-icons'
import { activityService } from '../../utils/activityService'
import { Loading } from '../Loading'

const Kegiatan = () => {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadActivities()
    }, [])

    const loadActivities = async () => {
        try {
            setLoading(true)
            const data = await activityService.getAllActivities()
            setActivities(data)
        } catch (err) {
            setError('Gagal memuat data kegiatan')
            console.error('Error loading activities:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus kegiatan "${title}"?`)) {
            return
        }

        try {
            await activityService.deleteActivity(id)
            setActivities(activities.filter(activity => activity.id !== id))
        } catch (err) {
            setError('Gagal menghapus kegiatan')
            console.error('Error deleting activity:', err)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    if (loading) return <Loading />

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">Kegiatan Terkini</h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">Kelola kegiatan dan aktivitas terbaru</p>
                </div>
                <Link
                    to="/kegiatan/tambah"
                    className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
                >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Tambah Kegiatan</span>
                </Link>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-xs sm:text-sm">
                    {error}
                </div>
            )}

            {/* Activities Grid */}
            {activities.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                    <FontAwesomeIcon icon={faImage} className="text-slate-300 text-4xl sm:text-6xl mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-slate-600 mb-1 sm:mb-2">Belum ada kegiatan</h3>
                    <p className="text-slate-500 text-sm sm:text-base">Mulai dengan menambahkan kegiatan pertama Anda</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Image */}
                            <div className="aspect-video bg-slate-100 overflow-hidden">
                                <img
                                    src={activity.image_url}
                                    alt={activity.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-4 sm:p-6">
                                <h3 className="font-semibold text-slate-800 text-base sm:text-lg mb-2 line-clamp-2">
                                    {activity.title}
                                </h3>

                                <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                                    {activity.description}
                                </p>

                                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
                                    <div className="flex items-center space-x-1">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                                        <span>{formatDate(activity.created_at)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                                    <Link
                                        to={`/kegiatan/edit/${activity.id}`}
                                        className="flex-1 bg-blue-50 text-blue-700 text-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                                        <span>Edit</span>
                                    </Link>

                                    <button
                                        onClick={() => handleDelete(activity.id, activity.title)}
                                        className="flex-1 bg-red-50 text-red-700 text-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                        <span>Hapus</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Kegiatan