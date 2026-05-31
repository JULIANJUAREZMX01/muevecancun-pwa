import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, Map, List, Bell, Trophy, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import OfflineBanner from '@/components/OfflineBanner';

const PRIMARY_NAV = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/mapa', icon: Map, label: 'Mapa' },
  { path: '/rutas', icon: List, label: 'Rutas' },
  { path: '/notificaciones', icon: Bell, label: 'Avisos' },
  { path: '/rewards', icon: Trophy, label: 'Puntos' },
];

const MORE_NAV = [
  { path: '/alertas', icon: '🔔', label: 'Alertas del Servicio' },
  { path: '/boletos', icon: '🎫', label: 'Boletos Digitales' },
  { path: '/agente', icon: '🦜', label: 'Agente IA' },
  { path: '/dashboard', icon: '🤖', label: 'Dashboard IA' },
];

export default function Layout() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  // Pages with full-screen layout (no padding adjustments needed)
  const isFullScreen = ['/mapa', '/agente'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FFFBF0', maxWidth: '480px', margin: '0 auto' }}>
      <OfflineBanner />

      {/* Main content */}
      <main className={`flex-1 ${isFullScreen ? 'overflow-hidden' : 'overflow-y-auto pb-24'}`}>
        <Outlet />
      </main>

      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full rounded-t-3xl px-4 pt-4 pb-32"
            style={{ maxWidth: '480px', backgroundColor: 'white', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <p className="text-xs font-black text-gray-400 mb-3 px-1">MÁS SECCIONES</p>
            <div className="grid grid-cols-2 gap-2">
              {MORE_NAV.map(({ path, icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-3 p-4 rounded-2xl transition-all"
                    style={{
                      backgroundColor: isActive ? '#D1FAE5' : '#F9FAFB',
                      border: isActive ? '2px solid #BBF7D0' : '2px solid transparent',
                    }}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-sm font-bold" style={{ color: isActive ? '#2D6A4F' : '#374151' }}>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50"
        style={{ maxWidth: '480px', backgroundColor: '#fff', borderTop: '2px solid #FFD60A' }}
      >
        <div className="bottom-nav flex items-center justify-around px-1 pt-2">
          {PRIMARY_NAV.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
                style={{ color: isActive ? '#2D6A4F' : '#9CA3AF' }}
              >
                <div
                  className="p-1.5 rounded-xl transition-all"
                  style={{
                    backgroundColor: isActive ? '#D1FAE5' : 'transparent',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px]" style={{ fontWeight: isActive ? 800 : 600 }}>{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(v => !v)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
            style={{ color: showMore || MORE_NAV.some(n => n.path === location.pathname) ? '#2D6A4F' : '#9CA3AF' }}
          >
            <div
              className="p-1.5 rounded-xl transition-all"
              style={{
                backgroundColor: showMore || MORE_NAV.some(n => n.path === location.pathname) ? '#D1FAE5' : 'transparent',
                transform: showMore ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <ChevronUp
                size={21}
                strokeWidth={showMore || MORE_NAV.some(n => n.path === location.pathname) ? 2.5 : 2}
                style={{ transition: 'transform 0.2s', transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </div>
            <span className="text-[10px]" style={{ fontWeight: showMore || MORE_NAV.some(n => n.path === location.pathname) ? 800 : 600 }}>Más</span>
          </button>
        </div>
      </nav>
    </div>
  );
}