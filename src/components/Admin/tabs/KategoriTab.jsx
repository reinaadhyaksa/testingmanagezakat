import { useState, useEffect } from 'react'
import { supabase } from '../../../utils/supabase'
import DataManagementTab from './DataManagementTab'

const KategoriTab = () => {
    const [kategori, setKategori] = useState([])
    const [loading, setLoading] = useState(false)
    const [nama, setNama] = useState('')
    const [editingId, setEditingId] = useState(null)

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

    useEffect(() => {
        fetchKategori()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!nama.trim()) {
            alert('Nama harus diisi')
            return
        }

        setLoading(true)
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('kategori_penerima')
                    .update({ nama: nama })
                    .eq('id', editingId)
                if (error) throw error
                alert('Data berhasil diupdate')
            } else {
                const { error } = await supabase
                    .from('kategori_penerima')
                    .insert([{ nama: nama }])
                if (error) throw error
                alert('Data berhasil ditambahkan')
            }

            fetchKategori()
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
            const { error } = await supabase
                .from('kategori_penerima')
                .delete()
                .eq('id', id)
            if (error) throw error
            alert('Data berhasil dihapus')
            fetchKategori()
        } catch (error) {
            console.error('Error deleting data:', error)
            alert('Gagal menghapus data')
        }
    }

    const cancelEdit = () => {
        setNama('')
        setEditingId(null)
    }

    return (
        <DataManagementTab
            title="Kategori Penerima"
            data={kategori}
            loading={loading}
            nama={nama}
            setNama={setNama}
            editingId={editingId}
            onSubmit={handleSubmit}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCancelEdit={cancelEdit}
            placeholder="Masukkan nama kategori"
        />
    )
}

export default KategoriTab