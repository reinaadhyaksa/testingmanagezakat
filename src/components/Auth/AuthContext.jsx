import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // Query ke tabel usersomcar
            const { data, error } = await supabase
                .from('usersomcar')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error) throw error;
            if (!data) throw new Error('Email atau password salah');

            // Set default profile picture jika tidak ada
            const userData = {
                ...data,
                profile_picture: data.profile_picture || 'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg'
            };

            // Simpan user ke state dan localStorage
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

            return { data: userData, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('user');
        return { error: null };
    };

    const updateProfile = async (updates) => {
        if (!user) return { error: new Error('User not logged in') };

        try {
            const { data, error } = await supabase
                .from('usersomcar')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            // Update user state
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const updateProfilePicture = async (newProfilePictureUrl) => {
        return await updateProfile({ profile_picture: newProfilePictureUrl });
    };

    const updateName = async (newName) => {
        return await updateProfile({ name: newName });
    };

    // Fungsi untuk menambahkan user baru
    const addUser = async (email, password, name) => {
        try {
            const defaultProfilePicture = 'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg';

            const { data, error } = await supabase
                .from('usersomcar')
                .insert([
                    {
                        email,
                        password,
                        name,
                        profile_picture: defaultProfilePicture
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    // Fungsi untuk mendapatkan semua users (kecuali user yang sedang login)
    const getUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('usersomcar')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    // Fungsi untuk menghapus user
    const deleteUser = async (userId) => {
        try {
            // Jangan izinkan menghapus diri sendiri
            if (userId === user?.id) {
                throw new Error('Tidak dapat menghapus akun sendiri');
            }

            const { error } = await supabase
                .from('usersomcar')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    const value = {
        user,
        login,
        logout,
        loading,
        updateProfile,
        updateProfilePicture,
        updateName,
        addUser,
        getUsers,
        deleteUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};