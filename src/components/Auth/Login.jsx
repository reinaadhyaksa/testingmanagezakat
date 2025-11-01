import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHandHoldingDollar,
    faExclamationTriangle,
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

            navigate('/dashboard');
        } catch (error) {
            setError(error.message || 'Login gagal. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <FontAwesomeIcon
                            icon={faHandHoldingDollar}
                            className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                        />
                    </div>
                </div>
                <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-slate-800">
                    Sistem Manajemen Zakat & Infaq
                </h2>
                <p className="mt-2 text-center text-xs sm:text-sm text-slate-600">
                    Masuk ke akun administrator Anda
                </p>
            </div>

            <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md">
                <div className="bg-white py-6 sm:py-8 px-4 sm:px-6 shadow-xl rounded-2xl border border-green-100">
                    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                                <div className="flex items-start">
                                    <FontAwesomeIcon
                                        icon={faExclamationTriangle}
                                        className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs sm:text-sm font-medium text-red-800 break-words">
                                            {error}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-green-600 text-sm sm:text-base" />
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
                                    className="appearance-none block w-full px-3 sm:px-4 py-2 sm:py-3 border border-green-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors duration-200 bg-white"
                                    placeholder="adminjulio@admin.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                <FontAwesomeIcon icon={faLock} className="mr-2 text-green-600 text-sm sm:text-base" />
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
                                    className="appearance-none block w-full px-3 sm:px-4 py-2 sm:py-3 border border-green-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors duration-200 bg-white"
                                    placeholder="managezakat2025"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm sm:text-base font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2 sm:mr-3"></div>
                                        <span className="text-xs sm:text-sm">Memproses...</span>
                                    </div>
                                ) : (
                                    <span className="flex items-center text-xs sm:text-sm">
                                        <FontAwesomeIcon icon={faLock} className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                        Masuk ke Sistem
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="text-center pt-3 sm:pt-4 border-t border-green-100">
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