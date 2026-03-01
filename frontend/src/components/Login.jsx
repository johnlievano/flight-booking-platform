import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const Login = ({ onLogin, onRegisterClick, onForgotClick, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/users/login`, {
                email,
                password
            });
            const token = response.data.token;
            onLogin(token);
        } catch (err) {
            const message = err.response?.data?.error || 'Error al conectar con el servidor';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // funcion para rellenar automaticamente los campos del formulario
    const handleAutoFill = (testEmail, testPassword) => {
        setEmail(testEmail);
        setPassword(testPassword);
        setError('');
    };

    return (
        <div 
            className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center bg-cover bg-center bg-no-repeat relative p-4 gap-6"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')" }}
        >
            <style>{`
                @keyframes fadeSlideUp {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animacion-tarjeta {
                    opacity: 0;
                    animation: fadeSlideUp 0.6s ease-out forwards;
                }
            `}</style>

            <div className="absolute inset-0 bg-[#2A3F45]/80 backdrop-blur-sm"></div>

            {/* boton de regreso a la bienvenida */}
            <button 
                onClick={onBack}
                className="absolute top-6 left-6 z-20 text-white/70 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Volver al inicio
            </button>

            {/* panel principal de login */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 sm:p-10 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md animacion-tarjeta">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#E5B869] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-[#2A3F45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">Intouch Airlines</h1>
                    <p className="text-gray-200 mt-2 font-light text-sm sm:text-base">Acceso al sistema</p>
                </div>

                {error && (
                    <div className="bg-red-500/30 border-l-4 border-red-500 text-white p-3 mb-6 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            className="w-full bg-white/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all focus:bg-white/30 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-200">
                                Contraseña
                            </label>
                            <button
                                type="button"
                                onClick={onForgotClick} 
                                className="text-xs text-[#E5B869] hover:text-white transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all focus:bg-white/30 text-sm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#E5B869] text-[#2A3F45] font-bold py-3 px-4 rounded-lg hover:bg-[#d4a556] transition-colors shadow-lg mt-4 disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-[#2A3F45]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="text-center mt-8 pt-6 border-t border-white/20">
                    <p className="text-gray-300 text-sm">
                        ¿No tienes cuenta?{' '}
                        <button
                            onClick={onRegisterClick}
                            className="text-[#E5B869] hover:text-white font-semibold transition-colors"
                        >
                            Regístrate aquí
                        </button>
                    </p>
                </div>
            </div>

            {/* panel de credenciales para la prueba tecnica */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 w-full max-w-sm animacion-tarjeta" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-xl font-bold text-white mb-1">Prueba Técnica</h2>
                <p className="text-gray-300 text-sm mb-6">Utilice estas credenciales para validar el sistema.</p>
                
                <div className="space-y-4 mb-6">
                    <div className="bg-white/10 border border-white/10 p-4 rounded-lg flex justify-between items-center group">
                        <div>
                            <p className="text-[#E5B869] text-xs font-bold mb-1 uppercase">Usuario de prueba 1</p>
                            <p className="text-white text-sm font-medium">juan@test.com</p>
                            <p className="text-gray-400 text-xs mt-1">Clave: 123456</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleAutoFill('juan@test.com', '123456')}
                            className="p-2 bg-white/5 hover:bg-white/20 rounded-md border border-white/10 text-white/70 hover:text-white transition-all"
                            title="Autocompletar datos"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div className="bg-white/10 border border-white/10 p-4 rounded-lg flex justify-between items-center group">
                        <div>
                            <p className="text-[#E5B869] text-xs font-bold mb-1 uppercase">Usuario de prueba 2</p>
                            <p className="text-white text-sm font-medium">sebas@test.com</p>
                            <p className="text-gray-400 text-xs mt-1">Clave: 123456</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleAutoFill('sebas@test.com', '123456')}
                            className="p-2 bg-white/5 hover:bg-white/20 rounded-md border border-white/10 text-white/70 hover:text-white transition-all"
                            title="Autocompletar datos"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/20">
                    <p className="text-gray-300 text-xs font-semibold mb-3">RECURSOS DEL PROYECTO</p>
                    <div className="grid grid-cols-2 gap-2">
                        <a href="#" className="bg-[#1a1e23] text-white text-xs py-2 px-3 rounded text-center hover:bg-black transition-colors flex items-center justify-center gap-1 border border-gray-700">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                            </svg>
                            Repositorio
                        </a>
                        <a href="#" className="bg-green-500/10 text-green-400 text-xs py-2 px-3 rounded text-center hover:bg-green-500/20 transition-colors border border-green-500/30">
                            Base de Datos
                        </a>
                        <a href="#" className="bg-blue-500/10 text-blue-400 text-xs py-2 px-3 rounded text-center hover:bg-blue-500/20 transition-colors col-span-2 border border-blue-500/30">
                            Backend
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;