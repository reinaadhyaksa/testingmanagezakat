import { useState } from 'react'
import ProfileTab from './tabs/ProfileTab'
import UsersTab from './tabs/UsersTab'
import MuzakkiTab from './tabs/MuzakkiTab'
import MustahiqTab from './tabs/MustahiqTab'
import DusunTab from './tabs/DusunTab'
import KategoriTab from './tabs/KategoriTab'

const Pengaturan = () => {
    const [activeTab, setActiveTab] = useState('profile')

    const tabs = [
        { id: 'profile', label: 'Profil Saya' },
        { id: 'users', label: 'Kelola Anggota' },
        { id: 'muzakki', label: 'Data Muzakki' },
        { id: 'mustahiq', label: 'Data Mustahiq' },
        { id: 'dusun', label: 'Dusun' },
        { id: 'kategori', label: 'Kategori Penerima' }
    ]

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileTab />
            case 'users':
                return <UsersTab />
            case 'muzakki':
                return <MuzakkiTab />
            case 'mustahiq':
                return <MustahiqTab />
            case 'dusun':
                return <DusunTab />
            case 'kategori':
                return <KategoriTab />
            default:
                return <ProfileTab />
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800">Pengaturan</h1>
                <p className="text-sm sm:text-base text-slate-600">Kelola profil, data muzakki, mustahiq, dusun, kategori penerima, dan users</p>
            </div>

            <div className="mb-4 sm:mb-6">
                <div className="border-b border-green-200">
                    <nav className="grid grid-cols-2 md:grid-cols-6 gap-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm text-center ${activeTab === tab.id
                                        ? 'border-green-500 text-green-600 bg-green-50'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {renderTabContent()}
        </div>
    )
}

export default Pengaturan