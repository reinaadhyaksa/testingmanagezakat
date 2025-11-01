// src/components/Admin/KegiatanForm.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faArrowLeft, faUpload } from '@fortawesome/free-solid-svg-icons'
import { activityService } from '../../utils/activityService'
import { cloudinaryService } from '../../utils/cloudinary'
import { Loading } from '../Loading'

const KegiatanForm = ({ mode = 'tambah' }) => {
    const navigate = useNavigate()
    const { id } = useParams()

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image_url: ''
    })

    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')

    useEffect(() => {
        if (mode === 'edit' && id) {
            loadActivity()
        }
    }, [mode, id])

    const loadActivity = async () => {
        try {
            setLoading(true)
            const activity = await activityService.getActivityById(id)
            setFormData({
                title: activity.title,
                description: activity.description,
                image_url: activity.image_url
            })
            setImagePreview(activity.image_url)
        } catch (err) {
            setError('Gagal memuat data kegiatan')
            console.error('Error loading activity:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('File harus berupa gambar')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Ukuran gambar maksimal 5MB')
            return
        }

        setImageFile(file)
        setError('')

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setImagePreview(e.target.result)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title.trim() || !formData.description.trim()) {
            setError('Judul dan deskripsi harus diisi')
            return
        }

        if (mode === 'tambah' && !imageFile) {
            setError('Gambar harus diupload')
            return
        }

        try {
            setSubmitting(true)
            setError('')

            let imageData = {}

            // Upload new image if provided
            if (imageFile) {
                imageData = await cloudinaryService.uploadImage(imageFile)
            }

            const activityData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                ...(Object.keys(imageData).length > 0 ? imageData : {}) // Only include if image uploaded
            }

            // Untuk edit, jika tidak upload gambar baru, gunakan image_url yang sudah ada
            if (mode === 'edit' && !imageFile) {
                activityData.image_url = formData.image_url
            }

            if (mode === 'tambah') {
                await activityService.createActivity(activityData)
            } else {
                await activityService.updateActivity(id, activityData)
            }

            navigate('/kegiatan')
        } catch (err) {
            setError(`Gagal ${mode === 'tambah' ? 'menambah' : 'mengedit'} kegiatan: ${err.message}`)
            console.error('Error submitting form:', err)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">
                        {mode === 'tambah' ? 'Tambah Kegiatan' : 'Edit Kegiatan'}
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">
                        {mode === 'tambah' ? 'Tambahkan kegiatan baru' : 'Edit kegiatan yang sudah ada'}
                    </p>
                </div>

                <button
                    onClick={() => navigate('/kegiatan')}
                    className="bg-slate-100 text-slate-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Kembali</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-xs sm:text-sm">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 sm:mb-3">
                            Gambar Kegiatan {mode === 'tambah' && '*'}
                        </label>

                        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="w-full max-w-md">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-32 sm:h-48 object-cover rounded-lg border border-slate-200"
                                    />
                                </div>
                            )}

                            {/* Upload Button */}
                            <label className="cursor-pointer bg-green-50 text-green-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center space-x-2 border-2 border-dashed border-green-200 w-full sm:w-auto text-sm sm:text-base">
                                <FontAwesomeIcon icon={faUpload} className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{imagePreview ? 'Ganti Gambar' : 'Upload Gambar'}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>

                            <p className="text-xs sm:text-sm text-slate-500 text-center">
                                Format: JPG, PNG, GIF (Maksimal 5MB)
                                {mode === 'edit' && ' - Biarkan kosong jika tidak ingin mengganti gambar'}
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                            Judul Kegiatan *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm sm:text-base"
                            placeholder="Masukkan judul kegiatan"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                            Deskripsi Kegiatan *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-vertical text-sm sm:text-base"
                            placeholder="Masukkan deskripsi lengkap tentang kegiatan"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-3 sm:pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
                        >
                            <FontAwesomeIcon icon={faSave} className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>
                                {submitting
                                    ? 'Menyimpan...'
                                    : mode === 'tambah' ? 'Tambah Kegiatan' : 'Update Kegiatan'
                                }
                            </span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default KegiatanForm