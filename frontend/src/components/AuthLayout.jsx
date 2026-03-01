const AuthLayout = ({ children, onBack, showBackButton = true }) => {
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

      {showBackButton && onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-20 text-white/70 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Volver al inicio
        </button>
      )}

      <div className="relative z-10 w-full max-w-md animacion-tarjeta">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;