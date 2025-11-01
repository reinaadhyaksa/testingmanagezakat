import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../Auth/AuthContext'
import { CLOUDINARY_NAME, CLOUDINARY_PRESET } from '../../utils/data'

const Pengaturan = () => {
    const [activeTab, setActiveTab] = useState('profile')
    const [dusun, setDusun] = useState([])
    const [kategori, setKategori] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [nama, setNama] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [profileName, setProfileName] = useState('')
    const [profilePicture, setProfilePicture] = useState('')
    const [profileLoading, setProfileLoading] = useState(false)

    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserName, setNewUserName] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [userLoading, setUserLoading] = useState(false)

    const { user, updateProfile, updateProfilePicture, addUser, getUsers, deleteUser, logout } = useAuth()

    useEffect(() => {
        if (user) {
            setProfileName(user.name || '')
            setProfilePicture(user.profile_picture || '')
        }
    }, [user])

    const fetchDusun = async () => {
        try {
            const { data, error } = await supabase
                .from('dusun')
                .select('*')
                .order('nama')
            if (error) throw error
            setDusun(data || [])
        } catch (error) {
            console.error('Error fetching dusun:', error)
            alert('Gagal memuat data dusun')
        }
    }

    const fetchKategori = async () => {
        try {
            const { data, error } = await supabase
                .from('kategori_penerima')
                .select('*')
                .order('nama')
            if (error) throw error
            setKategori(data || [])
        } catch (error) {
            console.error('Error fetching kategori:', error)
            alert('Gagal memuat data kategori')
        }
    }

    const fetchUsers = async () => {
        try {
            const { data, error } = await getUsers()
            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            alert('Gagal memuat data users')
        }
    }

    useEffect(() => {
        if (activeTab === 'dusun') {
            fetchDusun()
        } else if (activeTab === 'kategori') {
            fetchKategori()
        } else if (activeTab === 'users') {
            fetchUsers()
        }
    }, [activeTab])

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

    const handleAddUser = async (e) => {
        e.preventDefault()
        if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword.trim()) {
            alert('Semua field harus diisi')
            return
        }

        setUserLoading(true)
        try {
            const { error } = await addUser(newUserEmail, newUserPassword, newUserName)
            if (error) throw error

            alert('User berhasil ditambahkan')
            setNewUserEmail('')
            setNewUserName('')
            setNewUserPassword('')
            fetchUsers() 
        } catch (error) {
            console.error('Error adding user:', error)
            alert('Gagal menambah user: ' + error.message)
        } finally {
            setUserLoading(false)
        }
    }

    const handleDeleteUser = async (userId, userEmail) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus user ${userEmail}?`)) return

        try {
            const { error } = await deleteUser(userId)
            if (error) throw error

            alert('User berhasil dihapus')
            fetchUsers() 
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Gagal menghapus user: ' + error.message)
        }
    }

    const handleLogout = async () => {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            await logout()
            window.location.reload()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!nama.trim()) {
            alert('Nama harus diisi')
            return
        }

        setLoading(true)
        try {
            if (editingId) {
                const tableName = activeTab === 'dusun' ? 'dusun' : 'kategori_penerima'
                const { error } = await supabase
                    .from(tableName)
                    .update({ nama: nama })
                    .eq('id', editingId)
                if (error) throw error
                alert('Data berhasil diupdate')
            } else {
                const tableName = activeTab === 'dusun' ? 'dusun' : 'kategori_penerima'
                const { error } = await supabase
                    .from(tableName)
                    .insert([{ nama: nama }])
                if (error) throw error
                alert('Data berhasil ditambahkan')
            }

            if (activeTab === 'dusun') {
                fetchDusun()
            } else {
                fetchKategori()
            }

            setNama('')
            setEditingId(null)
        } catch (error) {
            console.error('Error saving data:', error)
            alert('Gagal menyimpan data')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (item) => {
        setNama(item.nama)
        setEditingId(item.id)
    }

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return

        try {
            const tableName = activeTab === 'dusun' ? 'dusun' : 'kategori_penerima'
            const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id)
            if (error) throw error
            alert('Data berhasil dihapus')
            if (activeTab === 'dusun') {
                fetchDusun()
            } else {
                fetchKategori()
            }
        } catch (error) {
            console.error('Error deleting data:', error)
            alert('Gagal menghapus data')
        }
    }

    const cancelEdit = () => {
        setNama('')
        setEditingId(null)
    }

    const currentData = activeTab === 'dusun' ? dusun : kategori

    return (
        <>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">Pengaturan</h1>
                    <p className="text-sm sm:text-base text-slate-600">Kelola profil, data dusun, kategori penerima, dan users</p>
                </div>

                <div className="mb-4 sm:mb-6">
                    <div className="border-b border-green-200">
                        <nav className="grid grid-cols-2 md:grid-cols-4 gap-0">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm text-center ${activeTab === 'profile'
                                    ? 'border-green-500 text-green-600 bg-green-50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                Profil Saya
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm text-center ${activeTab === 'users'
                                    ? 'border-green-500 text-green-600 bg-green-50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                Kelola Anggota
                            </button>
                            <button
                                onClick={() => setActiveTab('dusun')}
                                className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm text-center ${activeTab === 'dusun'
                                    ? 'border-green-500 text-green-600 bg-green-50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                Dusun
                            </button>
                            <button
                                onClick={() => setActiveTab('kategori')}
                                className={`py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm text-center ${activeTab === 'kategori'
                                    ? 'border-green-500 text-green-600 bg-green-50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                Kategori Penerima
                            </button>
                        </nav>
                    </div>
                </div>

                {activeTab === 'profile' ? (
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
                ) : activeTab === 'users' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">Tambah Anggota Baru</h2>
                            <form onSubmit={handleAddUser}>
                                <div className="mb-3 sm:mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nama Lengkap *
                                    </label>
                                    <input
                                        type="text"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                        placeholder="Masukkan nama lengkap"
                                        required
                                    />
                                </div>

                                <div className="mb-3 sm:mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                        placeholder="Masukkan email"
                                        required
                                    />
                                </div>

                                <div className="mb-4 sm:mb-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                        placeholder="Masukkan password"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={userLoading}
                                    className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm sm:text-base"
                                >
                                    {userLoading ? 'Menambahkan...' : 'Tambah User'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">Daftar Anggota</h2>
                            <div className="space-y-2 sm:space-y-3">
                                {users.length === 0 ? (
                                    <p className="text-slate-500 text-center py-3 sm:py-4 text-sm sm:text-base">
                                        Belum ada data anggota
                                    </p>
                                ) : (
                                    users.map((userItem) => (
                                        <div
                                            key={userItem.id}
                                            className="flex items-center justify-between p-2 sm:p-3 border border-green-200 rounded-lg hover:bg-green-50"
                                        >
                                            <div className="flex items-center space-x-2 sm:space-x-3">
                                                <img
                                                    src={userItem.profile_picture || 'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg'}
                                                    alt="Profile"
                                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-green-200"
                                                    onError={(e) => {
                                                        e.target.src = 'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg'
                                                    }}
                                                />
                                                <div>
                                                    <h3 className="font-medium text-slate-800 text-sm sm:text-base">{userItem.name}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">
                                {editingId ? 'Edit' : 'Tambah'} {activeTab === 'dusun' ? 'Dusun' : 'Kategori'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4 sm:mb-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nama {activeTab === 'dusun' ? 'Dusun' : 'Kategori'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={nama}
                                        onChange={(e) => setNama(e.target.value)}
                                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                        placeholder={`Masukkan nama ${activeTab === 'dusun' ? 'dusun' : 'kategori'}`}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm sm:text-base"
                                    >
                                        {loading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="bg-slate-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm sm:text-base"
                                        >
                                            Batal
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">
                                Daftar {activeTab === 'dusun' ? 'Dusun' : 'Kategori Penerima'}
                            </h2>
                            <div className="space-y-2 sm:space-y-3">
                                {currentData.length === 0 ? (
                                    <p className="text-slate-500 text-center py-3 sm:py-4 text-sm sm:text-base">
                                        Belum ada data {activeTab === 'dusun' ? 'dusun' : 'kategori penerima'}
                                    </p>
                                ) : (
                                    currentData.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-2 sm:p-3 border border-green-200 rounded-lg hover:bg-green-50"
                                        >
                                            <div>
                                                <h3 className="font-medium text-slate-800 text-sm sm:text-base">{item.nama}</h3>
                                            </div>
                                            <div className="flex space-x-1 sm:space-x-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default Pengaturan