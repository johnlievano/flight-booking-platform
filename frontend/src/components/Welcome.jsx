const Welcome = ({ onLoginClick, onRegisterClick }) => {
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
          animation: fadeSlideUp 0.8s ease-out forwards;
        }
      `}</style>

      <div className="absolute inset-0 bg-[#2A3F45]/80 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-md p-8 sm:p-12 rounded-2xl shadow-2xl border border-white/20 w-full max-w-3xl animacion-tarjeta text-center">
        
        <div className="w-20 h-20 bg-[#E5B869] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-[#2A3F45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-wide mb-4">
          Terminal de Servicio de Reserva
        </h1>
        
        <div className="w-24 h-1 bg-[#E5B869] mx-auto mb-6 rounded-full"></div>
        
        <p className="text-gray-200 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-light">
          Bienvenido al sistema de Intouch Airlines. A través de este terminal podrá acceder a nuestros servicios de reserva de vuelos intercontinentales. Si es su primera vez con nosotros, le invitamos a crear su cuenta de pasajero. Si ya forma parte de nuestra aerolínea, inicie sesión para continuar con sus reservas.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button 
            onClick={onLoginClick}
            className="w-full sm:w-auto px-10 py-3.5 bg-[#E5B869] text-[#2A3F45] font-bold rounded-lg hover:bg-[#d4a556] transition-all shadow-lg text-base"
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={onRegisterClick}
            className="w-full sm:w-auto px-10 py-3.5 bg-transparent text-white font-bold rounded-lg hover:bg-white/10 border border-white/40 transition-all shadow-lg text-base"
          >
            Registrarse
          </button>
        </div>

      </div>
    </div>
  );
};

export default Welcome;