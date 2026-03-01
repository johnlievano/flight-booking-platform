import { useState } from 'react';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';
import ForgotPassword from './components/ForgotPassword';

function App() {
  // verificamos si el usuario llegó a través del enlace de recuperación del correo
  const isResettingPassword = window.location.pathname === '/reset-password' || window.location.search.includes('token=');

  // estado para saber si el usuario está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token') && !isResettingPassword);

  // el estado inicial ahora es 'welcome' a menos que venga a resetear la contraseña
  const [view, setView] = useState(isResettingPassword ? 'reset' : 'welcome');

  // si ya hay sesión, mostramos directamente el dashboard
  if (isAuthenticated) {
    return <Dashboard onLogout={() => {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setView('welcome');
    }} />;
  }

  // contenedor principal con un fondo base para evitar saltos
  return (
    <div className="min-h-screen bg-[#2A3F45]">

      {view === 'welcome' && (
        <Welcome
          key="welcome-view"
          onLoginClick={() => setView('login')}
          onRegisterClick={() => setView('register')}
        />
      )}

      {view === 'login' && (
        <Login
          key="login-view"
          onLogin={(token) => {
            localStorage.setItem('token', token);
            setIsAuthenticated(true);
          }}
          onRegisterClick={() => setView('register')}
          onForgotClick={() => setView('forgot')}
          onBack={() => setView('welcome')}
        />
      )}

      {view === 'register' && (
        <Register
          key="register-view"
          onBackToWelcome={() => setView('welcome')}
          onGoToLogin={() => setView('login')}
          onRegisterSuccess={() => setView('login')}
        />
      )}

      {view === 'forgot' && (
        <ForgotPassword
          key="forgot-view"
          onBackToWelcome={() => setView('welcome')}
          onBackToLogin={() => setView('login')}
        />
      )}

      {view === 'reset' && (
        <ResetPassword
          key="reset-view"
          onBackToLogin={() => {
            window.history.replaceState({}, document.title, "/");
            setView('login');
          }}
        />
      )}
    </div>
  );
}

export default App;