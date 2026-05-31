import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, Map, List, Bell, BarChart2, Trophy } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/mapa', icon: Map, label: 'Mapa' },
  { path: '/alertas', icon: Bell, label: 'Alertas' },
  { path: '/rewards', icon: Trophy, label: 'Puntos' },
  { path: '/dashboard', icon: BarChart2, label: 'IA' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#FFFBF0', maxWidth: '480px', margin: '0 auto' }}>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full"
        style={{ maxWidth: '480px', backgroundColor: '#fff', borderTop: '2px solid #FFD60A', zIndex: 1000 }}
      >
        <div className="bottom-nav flex items-center justify-around px-2 pt-2">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
                style={{
                  color: isActive ? '#2D6A4F' : '#9CA3AF',
                }}
              >
                <div
                  className="p-1.5 rounded-xl transition-all"
                  style={{
                    backgroundColor: isActive ? '#FFFBF0' : 'transparent',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-700" style={{ fontWeight: isActive ? 800 : 600 }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}