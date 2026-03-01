import { useState } from 'react';
import axios from 'axios';
import AuthLayout from './AuthLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ForgotPassword = ({ onBackToWelcome, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/users/forgot-password`, { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
  <AuthLayout onBack={onBackToWelcome}>
    <div className="bg-white/10 backdrop-blur-md p-6 sm:p-10 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md animacion-tarjeta">
        
        <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">Recuperar Cuenta</h2>
            <p className="text-gray-200 mt-2 text-sm font-light">Ingresa tu correo para recibir un enlace</p>
        </div>
        
        {message && <div className="bg-green-500/30 border-l-4 border-green-500 text-white p-3 mb-6 rounded text-sm">{message}</div>}
        {error && <div className="bg-red-500/30 border-l-4 border-red-500 text-white p-3 mb-6 rounded text-sm">{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full bg-white/20 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5B869] transition-all text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5B869] text-[#2A3F45] font-bold py-3 rounded-lg hover:bg-[#d4a556] transition-colors shadow-lg mt-4 disabled:opacity-70 text-sm sm:text-base flex justify-center items-center"
            >
              {loading ? 'Enviando...' : 'Enviar Enlace'}
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
    </AuthLayout>
  );
};

export default ForgotPassword;