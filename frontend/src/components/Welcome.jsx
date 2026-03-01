import React from 'react';

const Welcome = ({ onLoginClick, onRegisterClick }) => {
  return (
    // Contenedor principal con imagen de fondo de aeropuerto
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative p-4 overflow-hidden"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')" }}
    >
      {/* Estilos CSS inyectados para las animaciones */}
      <style>{`
        /* Animacion de entrada suave para la tarjeta */
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animacion-tarjeta {
          animation: fadeSlideUp 0.8s ease-out forwards;
        }

        /* Animacion de flotacion suave para el avion del titulo */
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

      {/* Capa de superposicion oscura y borrosa para mejorar la lectura */}
      <div className="absolute inset-0 bg-[#2A3F45]/85 backdrop-blur-sm"></div>

      {/* Tarjeta principal de contenido */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl animacion-tarjeta text-center">

        {/* Ilustracion del Piloto (Estilo diferente a los avatares de usuario) */}
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 bg-[#E5B869]/20 rounded-full flex items-center justify-center p-2 shadow-lg border-2 border-[#E5B869]/50">
            <img
              src="/Logo_Intouch_AirLines.png"
              alt="Logo Intouch Airlines"
              className="w-full h-full object-contain drop-shadow-sm rounded-full"
            />
          </div>
        </div>

        {/* Titulo principal con el nuevo avion animado */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-wide text-shadow-sm">
            BIENVENIDO A INTOUCH
          </h1>
          {/* Icono SVG de avion elegante con animacion de flotacion */}
          <svg className="w-10 h-10 text-[#E5B869] avion-flotante" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#E5B869] tracking-[0.2em] uppercase mb-6">Airlines</h2>

        {/* Linea divisoria */}
        <div className="w-24 h-1.5 bg-[#E5B869] mx-auto mb-8 rounded-full shadow-sm opacity-80"></div>

        {/* Texto de bienvenida formal */}
        <p className="text-gray-100 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
          Descubra una nueva era en viajes nacionales. Le invitamos cordialmente a <strong className="text-[#E5B869] font-medium">crear su cuenta de pasajero</strong> para acceder a rutas exclusivas, gestionar sus reservas y comenzar su próximo viaje con nosotros.
        </p>

        {/* Botones de accion */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">

          {/* Boton Principal: Registrarse */}
          <button
            onClick={onRegisterClick}
            className="w-full sm:w-auto px-10 py-4 bg-[#E5B869] text-[#2A3F45] font-bold rounded-xl hover:bg-[#d4a556] hover:-translate-y-1 transition-all shadow-[0_4px_20px_rgba(229,184,105,0.4)] text-lg"
          >
            Registrarse Ahora
          </button>

          {/* Boton Secundario: Iniciar Sesion */}
          <button
            onClick={onLoginClick}
            className="w-full sm:w-auto px-10 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 border-2 border-white/30 hover:border-white/60 transition-all text-lg backdrop-blur-sm"
          >
            Ya tengo cuenta
          </button>

        </div>

      </div>
    </div>
  );
};

export default Welcome;