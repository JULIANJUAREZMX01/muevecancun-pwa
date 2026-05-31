import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, AlertTriangle, XCircle, Info, Navigation, RefreshCw, Send } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AlertDispatchPanel from '@/components/admin/AlertDispatchPanel';

const TYPE_CONFIG = {
  delay: { icon: '⏱️', label: 'Demora', color: '#92400E', bg: '#FEF3C7', border: '#F59E0B' },
  cancellation: { icon: '🚫', label: 'Cancelación', color: '#991B1B', bg: '#FEE2E2', border: '#EF4444' },
  detour: { icon: '🔄', label: 'Desvío', color: '#1D4ED8', bg: '#DBEAFE', border: '#3B82F6' },
  info: { icon: 'ℹ️', label: 'Información', color: '#2D6A4F', bg: '#D1FAE5', border: '#10B981' },
  emergency: { icon: '🚨', label: 'Emergencia', color: '#7F1D1D', bg: '#FEE2E2', border: '#DC2626' },
};

const SEVERITY_CONFIG = {
  low: { label: 'Baja', color: '#065F46', bg: '#D1FAE5' },
  medium: { label: 'Media', color: '#92400E', bg: '#FEF3C7' },
  high: { label: 'Alta', color: '#991B1B', bg: '#FEE2E2' },
};

const SAMPLE_ALERTS = [
  { id: 'a1', title: 'Demora en Zona Hotelera', message: 'La R1 presenta demoras de 15-20 minutos por obras en Blvd. Kukulcán Km 9. Se recomienda tomar la R1A como alternativa.', type: 'delay', severity: 'medium', route_number: 'R1', is_active: true, created_date: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a2', title: 'Servicio normal restituido', message: 'La R2 opera con normalidad después del accidente vial de esta mañana. Gracias por su paciencia.', type: 'info', severity: 'low', route_number: 'R2', is_active: true, created_date: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a3', title: 'Desvío por evento cultural', message: 'Ruta R13 con desvío temporal por el Festival del Caribe en el parque Las Palapas. Vigente hasta las 22:00 hrs.', type: 'detour', severity: 'medium', route_number: 'R13', is_active: true, created_date: new Date(Date.now() - 1800000).toISOString() },
  { id: 'a4', title: 'Incremento de frecuencia', message: 'Durante el fin de semana, la R1 operará con frecuencia de 5 minutos en horas pico (7-9am y 5-8pm) para mayor comodidad.', type: 'info', severity: 'low', route_number: 'R1', is_active: true, created_date: new Date(Date.now() - 86400000).toISOString() },
];

function AlertCard({ alert }) {
  const type = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
  
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 60) return `Hace ${mins} min`;
    if (hours < 24) return `Hace ${hours}h`;
    return 'Ayer';
  };

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(45,106,79,0.08)', borderLeft: `4px solid ${type.border}` }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{type.icon}</span>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-bold text-sm" style={{ color: '#1F2937' }}>{alert.title}</p>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ color: severity.color, backgroundColor: severity.bg }}
              >
                {severity.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2 leading-relaxed">{alert.message}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {alert.route_number && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#FFFBF0', color: '#2D6A4F', border: '1px solid #D1FAE5' }}
                  >
                    Ruta {alert.route_number}
                  </span>
                )}
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: type.bg, color: type.color }}
                >
                  {type.label}
                </span>
              </div>
              <span className="text-xs text-gray-400">{timeAgo(alert.created_date)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['all-alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date'),
  });

  const displayAlerts = alerts.length > 0 ? alerts : SAMPLE_ALERTS;
  const activeAlerts = displayAlerts.filter(a => a.is_active !== false);

  const filtered = filterType === 'all'
    ? activeAlerts
    : activeAlerts.filter(a => a.type === filterType);

  const highSeverity = activeAlerts.filter(a => a.severity === 'high').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-4 pt-12 pb-5">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-white font-black text-xl">🔔 Alertas del Servicio</h1>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <RefreshCw size={16} className="text-white" />
            </button>
          </div>
          <p className="text-green-100 text-sm">
            {activeAlerts.length} alertas activas
            {highSeverity > 0 && <span className="ml-2 text-yellow-300 font-bold">• {highSeverity} urgentes</span>}
          </p>

          {/* Filter pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'delay', label: '⏱️ Demoras' },
              { key: 'cancellation', label: '🚫 Cancelaciones' },
              { key: 'detour', label: '🔄 Desvíos' },
              { key: 'info', label: 'ℹ️ Info' },
              { key: 'dispatch', label: '📢 Enviar' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: filterType === f.key ? '#FFD60A' : 'rgba(255,255,255,0.2)',
                  color: filterType === f.key ? '#2D6A4F' : 'white',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Dispatch panel tab */}
        {filterType === 'dispatch' && <AlertDispatchPanel />}

        {/* High severity banner */}
        {filterType !== 'dispatch' && highSeverity > 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ backgroundColor: '#FEE2E2', border: '2px solid #EF4444' }}
          >
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-black text-sm" style={{ color: '#991B1B' }}>Alerta de alta prioridad</p>
              <p className="text-xs" style={{ color: '#B91C1C' }}>
                {highSeverity} {highSeverity === 1 ? 'alerta requiere' : 'alertas requieren'} tu atención
              </p>
            </div>
          </div>
        )}

        {filterType !== 'dispatch' && isLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Cargando alertas...</p>
          </div>
        ) : filterType !== 'dispatch' && filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl">✅</span>
            <p className="font-black text-lg mt-3" style={{ color: '#2D6A4F' }}>Sin alertas</p>
            <p className="text-gray-500 text-sm">Todos los servicios operan con normalidad</p>
          </div>
        ) : filterType !== 'dispatch' ? (
          filtered.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        ) : null}

        {/* Info box */}
        {filterType !== 'dispatch' && (
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span>🦜</span>
            <span className="text-xs font-black" style={{ color: '#065F46' }}>CONSEJO</span>
          </div>
          <p className="text-xs" style={{ color: '#047857' }}>
            Activa las notificaciones push para recibir alertas en tiempo real de tus rutas favoritas. ¡Tu tucán te avisará! 🔔
          </p>
        </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}