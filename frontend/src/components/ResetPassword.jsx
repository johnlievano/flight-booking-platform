import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ResetPassword = ({ onBackToLogin }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  // extraer el token de la URL al cargar la página
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("No se encontró un token de seguridad válido. Por favor solicita un nuevo enlace.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/reset-password`, {
        token,
        newPassword
      });
      setMessage(response.data.message);
      // redirigir al login después de 3 segundos
      setTimeout(onBackToLogin, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative p-4"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')" }}
    >
      <style>{`
          @keyframes fadeSlideUp {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
          }
          .animacion-tarjeta {
              animation: fadeSlideUp 0.6s ease-out forwards;
          }
      `}</style>

      <div className="absolute inset-0 bg-[#2A3F45]/80 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 sm:p-10 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md animacion-tarjeta">
        
        <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">Nueva Contraseña</h2>
            <p className="text-gray-200 mt-1 text-sm font-light">Ingresa tu nueva clave de acceso</p>
        </div>
        
        {message && <div className="bg-green-500/30 border-l-4 border-green-500 text-white p-3 mb-6 rounded text-sm text-center">{message}</div>}
        {error && <div className="bg-red-500/30 border-l-4 border-red-500 text-white p-3 mb-6 rounded text-sm text-center">{error}</div>}

        {!message && token && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm"
                required
              />
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-200 mb-1">Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5B869] text-[#2A3F45] font-bold py-3 rounded-lg hover:bg-[#d4a556] transition-colors shadow-lg mt-4 disabled:opacity-70 text-sm sm:text-base"
            >
              {loading ? 'Guardando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        )}

        <div className="text-center mt-8 pt-6 border-t border-white/20">
            <button onClick={onBackToLogin} className="text-gray-300 text-sm hover:text-white transition-colors flex items-center justify-center w-full gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Volver al inicio de sesión
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;