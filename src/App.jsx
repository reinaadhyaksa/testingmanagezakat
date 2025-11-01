import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Beranda from './components/pages/Beranda'
import Dashboard from './components/Admin/Dashboard'
import Pemasukan from './components/Admin/Pemasukan'
import PemasukanForm from './components/Admin/PemasukanForm'
import Pengeluaran from './components/Admin/Pengeluaran'
import PengeluaranForm from './components/Admin/PengeluaranForm'
import Laporan from './components/Admin/Laporan'
import Kegiatan from './components/Admin/Kegiatan'
import KegiatanForm from './components/Admin/KegiatanForm'
import Pengaturan from './components/Admin/Pengaturan'
import Login from './components/Auth/Login'
import { AuthProvider, useAuth } from './components/Auth/AuthContext'
import { Loading } from './components/Loading'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  return user ? children : <Navigate to="/login" />
}

// Komponen untuk halaman admin dengan header sidebar
const AdminLayout = ({ children }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

// Komponen untuk halaman publik dengan header biasa
const PublicLayout = ({ children }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <main>
        {children}
      </main>
    </div>
  )
}

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Redirect root path ke /beranda */}
        <Route path="/" element={<Navigate to="/beranda" replace />} />

        {/* Halaman beranda tanpa proteksi dengan header beranda */}
        <Route path="/beranda" element={
          <PublicLayout>
            <Beranda />
          </PublicLayout>
        } />

        {/* Halaman login dengan layout publik */}
        <Route path="/login" element={
          <PublicLayout>
            <Login />
          </PublicLayout>
        } />

        {/* Halaman admin dengan proteksi dan header sidebar */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pemasukan" element={
          <ProtectedRoute>
            <AdminLayout>
              <Pemasukan />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pemasukan/tambah" element={
          <ProtectedRoute>
            <AdminLayout>
              <PemasukanForm mode="tambah" />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pemasukan/edit/:id" element={
          <ProtectedRoute>
            <AdminLayout>
              <PemasukanForm mode="edit" />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pengeluaran" element={
          <ProtectedRoute>
            <AdminLayout>
              <Pengeluaran />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pengeluaran/tambah" element={
          <ProtectedRoute>
            <AdminLayout>
              <PengeluaranForm mode="tambah" />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pengeluaran/edit/:id" element={
          <ProtectedRoute>
            <AdminLayout>
              <PengeluaranForm mode="edit" />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/laporan" element={
          <ProtectedRoute>
            <AdminLayout>
              <Laporan />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/kegiatan" element={
          <ProtectedRoute>
            <AdminLayout>
              <Kegiatan />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/kegiatan/tambah" element={
          <ProtectedRoute>
            <AdminLayout>
              <KegiatanForm mode="tambah" />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/kegiatan/edit/:id" element={
          <ProtectedRoute>
            <AdminLayout>
              <KegiatanForm mode="edit" />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/pengaturan" element={
          <ProtectedRoute>
            <AdminLayout>
              <Pengaturan />
            </AdminLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App