import { useState } from 'react';
import axios from 'axios';
import AuthLayout from './AuthLayout'; // 👈 FALTABA ESTA LÍNEA

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const Register = ({ onBackToWelcome, onGoToLogin, onRegisterSuccess }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/users/register`, { name, email, password });
            onRegisterSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout onBack={onBackToWelcome}>
            {/* SOLO LA TARJETA, sin fondo, sin overlay, sin style, sin animacion-tarjeta */}
            <div className="bg-white/10 backdrop-blur-md p-6 sm:p-10 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md my-8">
                
                <div className="text-center mb-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">Únete a Intouch</h1>
                    <p className="text-gray-200 mt-2 text-sm font-light">Crea tu cuenta de pasajero</p>
                </div>

                {error && (
                    <div className="bg-red-500/30 border-l-4 border-red-500 text-white p-3 mb-6 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-1">Nombre completo</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: John Doe"
                               className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 sm:p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm" required />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-1">Correo electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@correo.com"
                               className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 sm:p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-1">Contraseña</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                                   className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 sm:p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-1">Confirmar</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                                   className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 sm:p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm" required />
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                            className="w-full bg-[#E5B869] text-[#2A3F45] font-bold py-3 rounded-lg hover:bg-[#d4a556] transition-all shadow-lg mt-6 disabled:opacity-70 text-sm sm:text-base flex justify-center items-center">
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-[#2A3F45]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : 'Crear Cuenta'}
                    </button>
                </form>

                {/* Puedes dejar esto o quitarlo, el Layout ya tiene su propio botón de volver */}
                <div className="text-center mt-6 pt-4 border-t border-white/20">
                    <button onClick={onGoToLogin} className="text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center w-full gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        inicio de sesión
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Register;