import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Bell, Star, Clock, ChevronRight, Zap, Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import OccupancyHeatmap from '@/components/home/OccupancyHeatmap';

const STATUS_CONFIG = {
  active: { label: 'Activa', color: '#2D6A4F', bg: '#D1FAE5' },
  delayed: { label: 'Demora', color: '#92400E', bg: '#FEF3C7' },
  suspended: { label: 'Suspendida', color: '#991B1B', bg: '#FEE2E2' },
  modified: { label: 'Modificada', color: '#1D4ED8', bg: '#DBEAFE' },
};

const POPULAR_ROUTES_DATA = [
  { number: 'R1', name: 'Centro ↔ Zona Hotelera', color: '#F4A261', fare: 12, frequency_minutes: 10, status: 'active' },
  { number: 'R2', name: 'Aeropuerto ↔ Centro', color: '#48CAE4', fare: 12, frequency_minutes: 15, status: 'active' },
  { number: 'R13', name: 'SM 64 ↔ Zona Hotelera Sur', color: '#FFD60A', fare: 12, frequency_minutes: 20, status: 'active' },
  { number: 'Express', name: 'Centro ↔ Zona Hotelera Rápida', color: '#2D6A4F', fare: 15, frequency_minutes: 8, status: 'active' },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { data: alerts = [] } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_active: true }),
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['popular-routes'],
    queryFn: () => base44.entities.Route.filter({ is_popular: true }),
  });

  const displayRoutes = routes.length > 0 ? routes : POPULAR_ROUTES_DATA;

  const timeStr = currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          {/* Decorative pattern */}
          <div className="absolute top-4 right-4 text-6xl">🌴</div>
          <div className="absolute top-12 right-20 text-3xl">🌺</div>
          <div className="absolute bottom-4 left-4 text-4xl">🦜</div>
        </div>
        <div className="relative px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🦜</span>
                <span className="text-white font-black text-xl" style={{ fontFamily: 'Nunito' }}>MueveCancún</span>
              </div>
              <p className="text-green-100 text-xs capitalize">{dateStr}</p>
            </div>
            <div className="text-right">
              <div className="text-white font-black text-2xl">{timeStr}</div>
              <div className="flex items-center gap-1 justify-end">
                <div className="live-dot w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-yellow-300 text-xs font-bold">EN VIVO</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="¿A dónde vas hoy? 🗺️"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-semibold outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: '#2D6A4F' }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '🗺️', label: 'Mapa Vivo', path: '/mapa', color: '#2D6A4F', bg: '#D1FAE5' },
            { icon: '🎫', label: 'Boletos', path: '/boletos', color: '#7C3AED', bg: '#EDE9FE' },
            { icon: '🔔', label: 'Alertas', path: '/alertas', color: '#92400E', bg: '#FEF3C7' },
            { icon: '🦜', label: 'Agente', path: '/agente', color: '#1D4ED8', bg: '#DBEAFE' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center route-card"
              style={{ backgroundColor: action.bg, color: action.color }}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-[11px] font-bold leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell size={16} style={{ color: '#F4A261' }} />
                <h2 className="font-black text-base" style={{ color: '#2D6A4F' }}>Alertas Activas</h2>
              </div>
              <Link to="/notificaciones" className="text-xs font-bold" style={{ color: '#F4A261' }}>⚙️ Config.</Link>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 2).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{
                    backgroundColor: alert.severity === 'high' ? '#FEE2E2' : '#FEF3C7',
                    borderLeft: `4px solid ${alert.severity === 'high' ? '#EF4444' : '#F59E0B'}`,
                  }}
                >
                  <span className="text-xl mt-0.5">{alert.type === 'delay' ? '⏱️' : alert.type === 'cancellation' ? '🚫' : '⚠️'}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1F2937' }}>{alert.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Occupancy Heatmap */}
        <OccupancyHeatmap />

        {/* Popular Routes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: '#2D6A4F' }} />
              <h2 className="font-black text-base" style={{ color: '#2D6A4F' }}>Rutas Populares</h2>
            </div>
            <Link to="/rutas" className="text-xs font-bold" style={{ color: '#F4A261' }}>Ver todas</Link>
          </div>
          <div className="space-y-3">
            {displayRoutes.slice(0, 4).map((route) => {
              const status = STATUS_CONFIG[route.status] || STATUS_CONFIG.active;
              return (
                <Link
                  key={route.id || route.number}
                  to="/rutas"
                  className="route-card flex items-center gap-4 p-4 rounded-2xl bg-white"
                  style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                    style={{ backgroundColor: route.color || '#2D6A4F' }}
                  >
                    {route.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: '#1F2937' }}>{route.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        <Clock size={10} className="inline mr-1" />
                        c/{route.frequency_minutes} min
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#2D6A4F' }}>${route.fare} MXN</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ color: status.color, backgroundColor: status.bg }}
                    >
                      {status.label}
                    </span>
                    <ChevronRight size={14} style={{ color: '#D1D5DB' }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTAs Row */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/agente"
            className="flex flex-col items-center gap-2 p-4 rounded-3xl text-center"
            style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)', boxShadow: '0 4px 16px rgba(45,106,79,0.3)' }}
          >
            <span className="text-3xl">🦜</span>
            <div>
              <p className="text-white font-black text-sm">Agente IA</p>
              <p className="text-green-100 text-xs">Planifica tu viaje</p>
            </div>
          </Link>
          <Link
            to="/dashboard"
            className="flex flex-col items-center gap-2 p-4 rounded-3xl text-center"
            style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', boxShadow: '0 4px 16px rgba(29,78,216,0.3)' }}
          >
            <span className="text-3xl">🤖</span>
            <div>
              <p className="text-white font-black text-sm">Dashboard IA</p>
              <p className="text-blue-100 text-xs">Análisis de rutas</p>
            </div>
          </Link>
        </div>

        {/* Tip del día */}
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: '#FFF9E6', border: '2px dashed #FFD60A' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span>💡</span>
            <span className="text-xs font-black" style={{ color: '#92400E' }}>TIP DEL DÍA</span>
          </div>
          <p className="text-sm" style={{ color: '#78350F' }}>
            Para ir de la Zona Hotelera al Centro, toma la <strong>R1</strong> desde el Km 12 de Blvd. Kukulcán. El trayecto dura aprox. 45 min y cuesta solo $12 MXN 🌴
          </p>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}