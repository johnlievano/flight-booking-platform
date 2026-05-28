import React from 'react';

const Welcome = ({ onLoginClick, onRegisterClick }) => {
  return (
    // CAMBIO CLAVE: Usamos 'h-screen' y 'overflow-hidden' para matar el scroll definitivamente
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative p-4 overflow-hidden"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')" }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animacion-tarjeta {
          animation: fadeSlideUp 0.8s ease-out forwards;
        }

        @keyframes gentleFloat {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .avion-flotante {
          display: inline-block;
          animation: gentleFloat 3s ease-in-out infinite;
        }
      `}</style>

      {/* Capa de fondo oscuro */}
      <div className="absolute inset-0 bg-[#2A3F45]/85 backdrop-blur-sm"></div>

      {/* Tarjeta principal (Se compactaron un poco los padding para que encaje mejor) */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl animacion-tarjeta text-center">

        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#E5B869]/20 rounded-full flex items-center justify-center p-2 shadow-lg border-2 border-[#E5B869]/50">
            <img
              src="/Logo_Áurea_Airlines.png"
              alt="Logo Áurea Airlines"
              className="w-full h-full object-contain drop-shadow-sm rounded-full"
            />
          </div>
        </div>

        {/* Titulo */}
        <div className="flex flex-col items-center justify-center text-center mb-4 w-full">
          <svg className="hidden sm:block w-6 h-6 sm:w-7 sm:h-7 text-[#E5B869] avion-flotante mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z" />
          </svg>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide text-shadow-sm uppercase leading-tight w-full">
            Bienvenido a
          </h1>

          <h2 className="text-lg sm:text-xl font-bold text-[#E5B869] tracking-[0.2em] uppercase mt-1">
            AeroManage
          </h2>
        </div>

        {/* Linea */}
        <div className="w-16 sm:w-20 h-1 bg-[#E5B869] mx-auto mb-5 rounded-full shadow-sm opacity-80"></div>

        {/* Texto */}
        <p className="text-gray-100 text-sm sm:text-base mb-6 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
          Descubra una nueva era en viajes con AeroManage. Le invitamos cordialmente a <strong className="text-[#E5B869] font-medium">crear su cuenta de pasajero</strong> para acceder a rutas exclusivas, gestionar sus reservas y comenzar su próximo viaje.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onRegisterClick}
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3.5 bg-[#E5B869] text-[#2A3F45] font-bold rounded-xl hover:bg-[#d4a556] hover:-translate-y-1 transition-all shadow-[0_4px_20px_rgba(229,184,105,0.4)] text-base"
          >
            Registrarse Ahora
          </button>

          <button
            onClick={onLoginClick}
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3.5 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 border-2 border-white/30 hover:border-white/60 transition-all text-base backdrop-blur-sm"
          >
            Ya tengo cuenta
          </button>
        </div>

      </div>
    </div>
  );
};

export default Welcome;