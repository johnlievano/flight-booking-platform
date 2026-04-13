import { useState } from 'react';
import axios from 'axios';
import AuthLayout from './AuthLayout';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const Register = ({ onBackToWelcome, onGoToLogin, onRegisterSuccess }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
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
            await axios.post(`${API_URL}/users/register`, { 
                name, 
                email, 
                phone, 
                password 
            });
            onRegisterSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout onBack={onBackToWelcome}>
            {/* Ocultamos el scroll interno si la pantalla es extremadamente pequeña */}
            <style>{`
                .ocultar-scroll::-webkit-scrollbar { display: none; }
                .ocultar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Contenedor principal ajustado: Sin my-8, paddings más compactos y límite de altura */}
            <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-lg animacion-tarjeta relative z-10 max-h-[95vh] overflow-y-auto ocultar-scroll flex flex-col justify-center">
                
                {/* Cabecera del formulario más compacta */}
                <div className="text-center mb-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#E5B869] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg">
                        <svg className="w-6 h-6 text-[#2A3F45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">Únete a Intouch</h1>
                    <p className="text-[#E5B869] mt-1 text-xs font-medium tracking-wider uppercase">Crea tu cuenta de pasajero</p>
                </div>

                {/* Mensaje de error */}
                {error && (
                    <div className="bg-red-500/30 border-l-4 border-red-500 text-white p-2.5 mb-4 rounded text-sm shadow-md text-center">
                        {error}
                    </div>
                )}

                {/* Formulario (space-y-3 en lugar de space-y-4 para ahorrar altura) */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Fila 1: Nombre y Teléfono (Dos columnas) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-200 mb-1">
                                Nombre completo
                            </label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="Ej: John Doe"
                                className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm focus:bg-white/30 shadow-inner" 
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-200 mb-1">
                                Número de teléfono
                            </label>
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                placeholder="Ej: 300 123 4567"
                                className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm focus:bg-white/30 shadow-inner" 
                                required 
                            />
                        </div>
                    </div>

                    {/* Fila 2: Correo electrónico */}
                    <div>
                        <label className="block text-xs font-medium text-gray-200 mb-1">
                            Correo electrónico
                        </label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="ejemplo@correo.com"
                            className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm focus:bg-white/30 shadow-inner" 
                            required 
                        />
                    </div>

                    {/* Fila 3: Contraseñas (Dos columnas) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-200 mb-1">
                                Contraseña
                            </label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="••••••••"
                                className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm focus:bg-white/30 shadow-inner" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-200 mb-1">
                                Confirmar contraseña
                            </label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                placeholder="••••••••"
                                className="w-full bg-white/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm focus:bg-white/30 shadow-inner" 
                                required 
                            />
                        </div>
                    </div>

                    {/* Botón de Registro */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#E5B869] text-[#2A3F45] font-bold py-3 rounded-xl hover:bg-[#d4a556] hover:-translate-y-0.5 transition-all shadow-[0_4px_15px_rgba(229,184,105,0.3)] mt-4 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center text-sm sm:text-base"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-[#2A3F45]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Crear Cuenta'}
                    </button>
                </form>

                {/* Enlace para volver al login */}
                <div className="text-center mt-4 pt-4 border-t border-white/20">
                    <p className="text-gray-300 text-xs sm:text-sm">
                        ¿Ya tienes una cuenta?{' '}
                        <button 
                            onClick={onGoToLogin} 
                            className="text-[#E5B869] hover:text-white font-semibold transition-colors inline-flex items-center gap-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                            </svg>
                            Inicia sesión aquí
                        </button>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Register;