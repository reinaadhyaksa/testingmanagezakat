import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHandHoldingDollar,
    faExclamationTriangle,
    faInfoCircle,
    faLock,
    faEnvelope
} from '@fortawesome/free-solid-svg-icons';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Redirect jika sudah login
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await login(email, password);

            if (error) {
                throw error;
            }

            // Login berhasil, redirect ke dashboard
            navigate('/dashboard');
        } catch (error) {
            setError(error.message || 'Login gagal. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <FontAwesomeIcon
                            icon={faHandHoldingDollar}
                            className="w-10 h-10 text-white"
                        />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold text-slate-800">
                    Sistem Manajemen Zakat & Infaq
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Masuk ke akun administrator Anda
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-green-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-start">
                                    <FontAwesomeIcon
                                        icon={faExclamationTriangle}
                                        className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                                    />
                                    <div>
                                        <h3 className="text-sm font-medium text-red-800">
                                            {error}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-green-600" />
                                Alamat Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-green-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200 bg-white"
                                    placeholder="adminjulio@admin.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                <FontAwesomeIcon icon={faLock} className="mr-2 text-green-600" />
                                Kata Sandi
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-green-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200 bg-white"
                                    placeholder="managezakat2025"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 transform hover:scale-[1.02]"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                                        Memproses...
                                    </div>
                                ) : (
                                    <span className="flex items-center">
                                        <FontAwesomeIcon icon={faLock} className="w-4 h-4 mr-2" />
                                        Masuk ke Sistem
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Informasi Login */}
                        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-start">
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                                />
                                <div>
                                    <h3 className="text-sm font-medium text-green-800 mb-2">
                                        Informasi Login Demo
                                    </h3>
                                    <div className="text-sm text-green-700 space-y-1">
                                        <div className="flex items-center">
                                            <span className="font-medium w-20">Email:</span>
                                            <span className="font-mono bg-green-100 px-2 py-1 rounded">adminjulio@admin.com</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium w-20">Password:</span>
                                            <span className="font-mono bg-green-100 px-2 py-1 rounded">managezakat2025</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-green-600 mt-2 italic">
                                        Gunakan kredensial di atas untuk mengakses sistem demo
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-4 border-t border-green-100">
                            <p className="text-xs text-slate-500">
                                Sistem Manajemen Zakat & Infaq - Transparan & Terpercaya
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;