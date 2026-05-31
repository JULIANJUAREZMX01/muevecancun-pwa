import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center"
      style={{ backgroundColor: '#FFFBF0', fontFamily: 'Nunito, sans-serif' }}
    >
      {/* Decorative elements top */}
      <div className="relative mb-4">
        <div className="flex items-end justify-center gap-2 mb-2">
          <span className="text-5xl">🌴</span>
          <span
            className="font-black leading-none"
            style={{ fontSize: '80px', color: '#FFD60A', textShadow: '3px 3px 0 #F4A261', lineHeight: 1 }}
          >
            404
          </span>
          <span className="text-5xl">🌴</span>
        </div>
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="text-2xl">👒</span>
          <span className="text-2xl">🩴</span>
        </div>
      </div>

      <h1
        className="text-2xl font-black mb-2"
        style={{ color: '#2D6A4F' }}
      >
        Página No Encontrada
      </h1>

      {/* Map illustration */}
      <div
        className="relative w-56 h-44 rounded-3xl overflow-hidden mb-4"
        style={{
          background: 'linear-gradient(135deg, #F4D03F 0%, #48CAE4 60%)',
          boxShadow: '0 8px 32px rgba(45,106,79,0.2)',
        }}
      >
        {/* Simplified Cancún coast */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white font-black text-sm drop-shadow" style={{ color: '#1A5276' }}>Zona Hotelera</p>
            <span className="text-2xl">🏖️</span>
            <span className="text-xl">📍</span>
          </div>
        </div>
        <div className="absolute bottom-2 left-3 text-xs font-bold" style={{ color: '#1A5276' }}>🌞 Hotel Zone</div>
        <div className="absolute top-3 right-3 text-xl">🏛️</div>
      </div>

      {/* Toucan mascot */}
      <div className="text-7xl mb-4">🦜</div>

      <p className="text-gray-600 text-sm mb-6 max-w-xs">
        ¡Oops! Parece que este destino no existe en nuestro mapa. Regresa al inicio y planifica tu viaje. 🗺️
      </p>

      <Link
        to="/"
        className="flex items-center gap-2 px-8 py-3.5 rounded-full font-black text-white text-base transition-transform active:scale-95"
        style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)', boxShadow: '0 4px 16px rgba(45,106,79,0.3)' }}
      >
        🏠 Ir al Inicio
      </Link>
    </div>
  );
}