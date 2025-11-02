import { useState, useEffect } from 'react'
import { useAuth } from '../../Auth/AuthContext'
import { CLOUDINARY_NAME, CLOUDINARY_PRESET } from '../../../utils/data'

const ProfileTab = () => {
    const [profileName, setProfileName] = useState('')
    const [profilePicture, setProfilePicture] = useState('')
    const [profileLoading, setProfileLoading] = useState(false)

    const { user, updateProfile, updateProfilePicture, logout } = useAuth()

    useEffect(() => {
        if (user) {
            setProfileName(user.name || '')
            setProfilePicture(user.profile_picture || '')
        }
    }, [user])

    const handleImageUpload = async (file) => {
        try {
            const uploadPreset = CLOUDINARY_PRESET
            const cloudName = CLOUDINARY_NAME

            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', uploadPreset)

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Cloudinary error:', errorData)
                throw new Error('Upload gagal: ' + (errorData.error?.message || 'Unknown error'))
            }

            const data = await response.json()
            return data.secure_url

        } catch (error) {
            console.error('Error uploading image:', error)
            throw new Error('Gagal mengupload gambar: ' + error.message)
        }
    }

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        if (!profileName.trim()) {
            alert('Nama harus diisi')
            return
        }

        setProfileLoading(true)
        try {
            const updates = {}

            if (profileName !== user.name) {
                updates.name = profileName
            }

            if (profilePicture !== user.profile_picture && profilePicture.startsWith('http')) {
                updates.profile_picture = profilePicture
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await updateProfile(updates)
                if (error) throw error
                alert('Profil berhasil diupdate')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Gagal mengupdate profil: ' + error.message)
        } finally {
            setProfileLoading(false)
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('File harus berupa gambar')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB')
            return
        }

        setProfileLoading(true)
        try {
            const imageUrl = await handleImageUpload(file)
            setProfilePicture(imageUrl)

            const { error } = await updateProfilePicture(imageUrl)
            if (error) throw error

            alert('Foto profil berhasil diupdate')
        } catch (error) {
            console.error('Error uploading profile picture:', error)
            alert('Gagal mengupload foto profil: ' + error.message)
        } finally {
            setProfileLoading(false)
        }
    }

    const handleLogout = async () => {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            await logout()
            window.location.reload()
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">Edit Profil</h2>
                <form onSubmit={handleProfileUpdate}>
                    <div className="mb-4 sm:mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Foto Profil
                        </label>
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="relative">
                                <img
                                    src={profilePicture || 'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg'}
                                    alt="Profile"
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-green-300"
                                    onError={(e) => {
                                        e.target.src = 'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg'
                                    }}
                                />
                                {profileLoading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    id="profile-picture"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="profile-picture"
                                    className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer text-xs sm:text-sm"
                                >
                                    Ganti Foto
                                </label>
                                <p className="text-xs text-slate-500 mt-1">
                                    Format: JPG, PNG (max 2MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nama Lengkap *
                        </label>
                        <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                            placeholder="Masukkan nama lengkap"
                            required
                        />
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            className="w-full px-3 py-2 border border-green-300 rounded-md bg-green-50 cursor-not-allowed text-sm sm:text-base"
                            disabled
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Email tidak dapat diubah
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm sm:text-base"
                        >
                            {profileLoading ? 'Menyimpan...' : 'Update Profil'}
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
                        >
                            Logout
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">Preview Profil</h2>
                <div className="text-center">
                    <img
                        src={profilePicture || 'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg'}
                        alt="Profile Preview"
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-green-500 mx-auto mb-3 sm:mb-4"
                        onError={(e) => {
                            e.target.src = 'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg'
                        }}
                    />
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">{profileName}</h3>
                    <p className="text-sm sm:text-base text-slate-600">{user?.email}</p>
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs sm:text-sm text-slate-600">
                            Perubahan akan langsung tersimpan dan terlihat di seluruh sistem.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfileTab