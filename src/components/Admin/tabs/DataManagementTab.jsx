const DataManagementTab = ({
    title,
    data,
    loading,
    nama,
    setNama,
    editingId,
    onSubmit,
    onEdit,
    onDelete,
    onCancelEdit,
    placeholder
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-green-200">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">
                    {editingId ? 'Edit' : 'Tambah'} {title}
                </h2>
                <form onSubmit={onSubmit}>
                    <div className="mb-4 sm:mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nama {title} *
                        </label>
                        <input
                            type="text"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                            placeholder={placeholder}
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
                                onClick={onCancelEdit}
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
                    Daftar {title}
                </h2>
                <div className="space-y-2 sm:space-y-3">
                    {data.length === 0 ? (
                        <p className="text-slate-500 text-center py-3 sm:py-4 text-sm sm:text-base">
                            Belum ada data {title.toLowerCase()}
                        </p>
                    ) : (
                        data.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-2 sm:p-3 border border-green-200 rounded-lg hover:bg-green-50"
                            >
                                <div>
                                    <h3 className="font-medium text-slate-800 text-sm sm:text-base">{item.nama}</h3>
                                </div>
                                <div className="flex space-x-1 sm:space-x-2">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(item.id)}
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
    )
}

export default DataManagementTab