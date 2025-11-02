import { useState, useEffect } from 'react'
import { useAuth } from '../../Auth/AuthContext'

const UsersTab = () => {
    const [users, setUsers] = useState([])
    const [newUserEmail, setNewUserEmail] = useState('')
    const [newUserName, setNewUserName] = useState('')
    const [newUserPassword, setNewUserPassword] = useState('')
    const [userLoading, setUserLoading] = useState(false)

    const { getUsers, addUser, deleteUser } = useAuth()

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
        fetchUsers()
    }, [])

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

    return (
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
                                        <p className="text-xs text-slate-500">{userItem.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
                                >
                                    Hapus
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default UsersTab