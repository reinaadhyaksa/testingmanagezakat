import { useState, useEffect } from 'react'
import { supabase } from '../../../utils/supabase'
import DataManagementTab from './DataManagementTab'

const DusunTab = () => {
    const [dusun, setDusun] = useState([])
    const [loading, setLoading] = useState(false)
    const [nama, setNama] = useState('')
    const [editingId, setEditingId] = useState(null)

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

    useEffect(() => {
        fetchDusun()
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
                    .from('dusun')
                    .update({ nama: nama })
                    .eq('id', editingId)
                if (error) throw error
                alert('Data berhasil diupdate')
            } else {
                const { error } = await supabase
                    .from('dusun')
                    .insert([{ nama: nama }])
                if (error) throw error
                alert('Data berhasil ditambahkan')
            }

            fetchDusun()
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
                .from('dusun')
                .delete()
                .eq('id', id)
            if (error) throw error
            alert('Data berhasil dihapus')
            fetchDusun()
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
            title="Dusun"
            data={dusun}
            loading={loading}
            nama={nama}
            setNama={setNama}
            editingId={editingId}
            onSubmit={handleSubmit}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCancelEdit={cancelEdit}
            placeholder="Masukkan nama dusun"
        />
    )
}

export default DusunTab