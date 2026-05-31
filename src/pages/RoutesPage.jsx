import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Clock, DollarSign, MapPin, Star, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { offlineCache } from '@/lib/offlineCache';
import { useOnlineStatus } from '@/lib/useOnlineStatus';

const STATUS_CONFIG = {
  active: { label: '✅ Activa', color: '#2D6A4F', bg: '#D1FAE5' },
  delayed: { label: '⏱️ Demora', color: '#92400E', bg: '#FEF3C7' },
  suspended: { label: '🚫 Suspendida', color: '#991B1B', bg: '#FEE2E2' },
  modified: { label: '🔄 Modificada', color: '#1D4ED8', bg: '#DBEAFE' },
};

const SAMPLE_ROUTES = [
  { id: 'r1', number: 'R1', name: 'Centro ↔ Zona Hotelera', color: '#F4A261', fare: 12, frequency_minutes: 10, status: 'active', origin: 'Centro (Tulum/Yaxchilán)', destination: 'Zona Hotelera (Km 25)', stops_count: 32, operating_hours_start: '05:00', operating_hours_end: '23:30', description: 'La ruta más importante de Cancún. Conecta el centro urbano con la Zona Hotelera por el Boulevard Kukulcán.', is_popular: true },
  { id: 'r2', number: 'R2', name: 'Aeropuerto ↔ Centro', color: '#48CAE4', fare: 12, frequency_minutes: 15, status: 'active', origin: 'Aeropuerto Internacional', destination: 'Centro Cancún', stops_count: 18, operating_hours_start: '06:00', operating_hours_end: '22:00', description: 'Conecta el aeropuerto internacional con el centro de la ciudad. Ideal para turistas con presupuesto limitado.', is_popular: true },
  { id: 'r13', number: 'R13', name: 'SM 64 ↔ Zona Hotelera Sur', color: '#FFD60A', fare: 12, frequency_minutes: 20, status: 'active', origin: 'SM 64', destination: 'Zona Hotelera Sur (Km 18)', stops_count: 24, operating_hours_start: '06:00', operating_hours_end: '22:00', description: 'Sirve la zona residencial SM 64 y conecta con la Zona Hotelera Sur.', is_popular: false },
  { id: 'r1a', number: 'R1A', name: 'Plaza Américas ↔ ZH Norte', color: '#52B788', fare: 12, frequency_minutes: 12, status: 'active', origin: 'Plaza Las Américas', destination: 'Zona Hotelera Norte', stops_count: 20, operating_hours_start: '06:30', operating_hours_end: '21:30', description: 'Variante de la R1 que pasa por Plaza Las Américas.', is_popular: false },
  { id: 'r15', number: 'R15', name: 'Central ↔ Puerto Morelos', color: '#E76F51', fare: 18, frequency_minutes: 30, status: 'active', origin: 'Central de Autobuses', destination: 'Puerto Morelos', stops_count: 15, operating_hours_start: '07:00', operating_hours_end: '20:00', description: 'Ruta suburbana que conecta Cancún con Puerto Morelos.', is_popular: false },
  { id: 'express', number: 'EXP', name: 'Express Centro ↔ Zona Hotelera', color: '#2D6A4F', fare: 15, frequency_minutes: 8, status: 'active', origin: 'Centro', destination: 'Km 12 Zona Hotelera', stops_count: 8, operating_hours_start: '07:00', operating_hours_end: '22:00', description: 'Servicio express con paradas limitadas para llegar más rápido a la Zona Hotelera.', is_popular: true },
];

function RouteCard({ route, isExpanded, onToggle }) {
  const status = STATUS_CONFIG[route.status] || STATUS_CONFIG.active;

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden route-card"
      style={{ boxShadow: '0 2px 16px rgba(45,106,79,0.08)' }}
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0"
          style={{ backgroundColor: route.color || '#2D6A4F', fontSize: route.number.length > 3 ? '10px' : '14px' }}
        >
          {route.number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: '#1F2937' }}>{route.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={10} style={{ color: '#9CA3AF' }} />
            <span className="text-xs text-gray-500">c/{route.frequency_minutes} min</span>
            <span className="text-xs font-bold" style={{ color: '#2D6A4F' }}>${route.fare} MXN</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: status.color, backgroundColor: status.bg }}
            >
              {status.label}
            </span>
          </div>
        </div>
        <div>
          {isExpanded
            ? <ChevronUp size={18} style={{ color: '#9CA3AF' }} />
            : <ChevronDown size={18} style={{ color: '#9CA3AF' }} />
          }
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          <p className="text-sm text-gray-600 mb-3">{route.description}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: '#F0FDF4' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={12} style={{ color: '#2D6A4F' }} />
                <span className="text-xs font-black text-green-800">ORIGEN</span>
              </div>
              <p className="text-xs text-gray-700">{route.origin}</p>
            </div>
            <div className="p-3 rounded-2xl" style={{ backgroundColor: '#FFF9E6' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={12} style={{ color: '#F4A261' }} />
                <span className="text-xs font-black text-orange-700">DESTINO</span>
              </div>
              <p className="text-xs text-gray-700">{route.destination}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-xl bg-gray-50">
              <p className="text-lg font-black" style={{ color: '#2D6A4F' }}>{route.stops_count}</p>
              <p className="text-xs text-gray-500">Paradas</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-gray-50">
              <p className="text-xs font-bold text-gray-700">{route.operating_hours_start}</p>
              <p className="text-xs text-gray-500">Primera</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-gray-50">
              <p className="text-xs font-bold text-gray-700">{route.operating_hours_end}</p>
              <p className="text-xs text-gray-500">Última</p>
            </div>
          </div>
          <Link
            to="/mapa"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: route.color, color: 'white' }}
          >
            <MapPin size={14} />
            Ver en el mapa
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RoutesPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const isOnline = useOnlineStatus();

  const { data: dbRoutes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      if (!isOnline) return offlineCache.getRoutes() || [];
      const data = await base44.entities.Route.list();
      if (data.length > 0) offlineCache.saveRoutes(data);
      return data;
    },
  });

  const displayRoutes = dbRoutes.length > 0 ? dbRoutes : SAMPLE_ROUTES;

  const filtered = displayRoutes.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.number.toLowerCase().includes(search.toLowerCase()) ||
      (r.origin || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.destination || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-4 pt-12 pb-5">
          <h1 className="text-white font-black text-xl mb-1">🚌 Rutas de Cancún</h1>
          <p className="text-green-100 text-sm">{displayRoutes.length} rutas disponibles</p>

          <div className="relative mt-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Busca ruta, origen o destino..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: '#2D6A4F' }}
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'active', label: '✅ Activas' },
              { key: 'delayed', label: '⏱️ Demora' },
              { key: 'suspended', label: '🚫 Suspendidas' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: filterStatus === f.key ? '#FFD60A' : 'rgba(255,255,255,0.2)',
                  color: filterStatus === f.key ? '#2D6A4F' : 'white',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl">🦜</span>
            <p className="text-gray-500 mt-3 font-semibold">No encontramos rutas con ese filtro</p>
          </div>
        ) : (
          filtered.map(route => (
            <RouteCard
              key={route.id || route.number}
              route={route}
              isExpanded={expandedId === (route.id || route.number)}
              onToggle={() => setExpandedId(expandedId === (route.id || route.number) ? null : (route.id || route.number))}
            />
          ))
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}