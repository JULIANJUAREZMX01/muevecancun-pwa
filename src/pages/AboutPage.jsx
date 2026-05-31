export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-5 pt-12 pb-6">
          <span className="text-4xl">🦜</span>
          <h1 className="text-white font-black text-2xl mt-2">Acerca de MueveCancún</h1>
          <p className="text-green-100 text-sm mt-1">Tu compañero de transporte en Cancún</p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 pb-28">
        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <h2 className="font-black text-lg mb-3" style={{ color: '#2D6A4F' }}>¿Qué es MueveCancún?</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            MueveCancún es la aplicación móvil de transporte público inteligente diseñada especialmente para residentes y visitantes de Cancún, Quintana Roo. Nuestra plataforma te permite navegar la red de camiones urbanos de la ciudad de forma fácil, segura y en tiempo real, sin importar si eres un viajero frecuente o alguien que toma el camión por primera vez.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <h2 className="font-black text-lg mb-3" style={{ color: '#2D6A4F' }}>¿Qué puedes hacer con la app?</h2>
          <ul className="space-y-2.5">
            {[
              { icon: '🗺️', text: 'Ver el mapa en vivo con la ubicación de los autobuses en tiempo real y sus rutas trazadas.' },
              { icon: '🚌', text: 'Consultar horarios, tarifas, paradas y frecuencias de todas las rutas de Cancún.' },
              { icon: '🔔', text: 'Recibir alertas instantáneas sobre demoras, desvíos, cancelaciones e incidentes en tu ruta.' },
              { icon: '🎫', text: 'Gestionar tus boletos digitales para un abordaje más rápido y sin efectivo.' },
              { icon: '🦜', text: 'Consultar al Agente IA para planificar tu viaje, conocer transbordos y rutas alternativas.' },
              { icon: '🏆', text: 'Ganar puntos y recompensas por cada viaje reportado y por tu participación en la comunidad.' },
              { icon: '📊', text: 'Acceder al Dashboard IA con análisis predictivos de tráfico y ocupación de rutas.' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <h2 className="font-black text-lg mb-3" style={{ color: '#2D6A4F' }}>¿Para quién es MueveCancún?</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            MueveCancún está pensada para <strong>residentes de Cancún</strong> que usan el transporte público a diario para ir al trabajo, la escuela o de compras, así como para <strong>turistas y visitantes</strong> que desean moverse por la ciudad y la Zona Hotelera de forma económica y eficiente. También es una herramienta valiosa para quienes buscan reducir su huella de carbono optando por el transporte colectivo sobre el vehículo particular.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <h2 className="font-black text-lg mb-3" style={{ color: '#2D6A4F' }}>¿Quién desarrolla MueveCancún?</h2>
          <p className="text-sm leading-relaxed text-gray-700">
            MueveCancún es desarrollada por un equipo local apasionado por la movilidad urbana sostenible y la tecnología cívica. Creemos que el acceso a información de transporte público de calidad es un derecho de todos los ciudadanos, no un privilegio. Trabajamos continuamente para mejorar la precisión de los datos, agregar nuevas rutas y escuchar el feedback de nuestra comunidad de usuarios para hacer de Cancún una ciudad más conectada e inteligente.
          </p>
        </div>

        <div
          className="p-4 rounded-2xl text-center"
          style={{ backgroundColor: '#FFF9E6', border: '2px dashed #FFD60A' }}
        >
          <span className="text-3xl block mb-2">🌴</span>
          <p className="font-black text-sm" style={{ color: '#92400E' }}>Hecho con orgullo en Cancún, México</p>
          <p className="text-xs text-amber-700 mt-1">Versión 2.0 · 2026</p>
        </div>
      </div>
    </div>
  );
}