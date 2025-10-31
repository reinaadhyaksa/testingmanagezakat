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

            // Simpan user ke state dan localStorage
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));

            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('user');
        return { error: null };
    };

    const value = {
        user,
        login,
        logout,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};