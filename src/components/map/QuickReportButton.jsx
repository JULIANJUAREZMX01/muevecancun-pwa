import { useState } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const INCIDENT_TYPES = [
  { id: 'traffic', label: 'Tráfico pesado', icon: '🚦', alertType: 'delay', severity: 'medium', title: 'Tráfico pesado reportado' },
  { id: 'accident', label: 'Accidente', icon: '🚨', alertType: 'emergency', severity: 'high', title: 'Accidente reportado' },
  { id: 'full', label: 'Bus lleno total', icon: '🔴', alertType: 'info', severity: 'low', title: 'Unidad llena reportada' },
  { id: 'detour', label: 'Desvío / obra', icon: '🔄', alertType: 'detour', severity: 'medium', title: 'Desvío reportado' },
];

export default function QuickReportButton({ routeNumber }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

  const handleReport = async (incident) => {
    setSending(true);
    const loc = await getLocation();
    const locText = loc ? ` (Ubicación: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})` : '';
    try {
      await base44.entities.Alert.create({
        title: incident.title,
        message: `Reporte ciudadano: ${incident.label}${routeNumber ? ` en la ruta ${routeNumber}` : ''}.${locText}`,
        type: incident.alertType,
        severity: incident.severity,
        route_number: routeNumber || undefined,
        is_active: true,
      });
      base44.functions.invoke('addPoints', { action: 'report' }).catch(() => {});
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); }, 1800);
    } catch (e) {
      console.error('Error reportando incidente:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="absolute z-[1000] w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
        style={{
          bottom: '120px',
          right: '12px',
          background: 'linear-gradient(135deg, #EF4444, #F97316)',
          boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
        }}
        aria-label="Reportar incidente"
      >
        <AlertTriangle size={22} className="text-white" />
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="absolute inset-0 z-[1003] flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl px-5 pt-5 pb-8"
            style={{ backgroundColor: 'white' }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-black text-lg" style={{ color: '#991B1B' }}>🚨 Reportar incidente</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Tu ubicación se enviará automáticamente 📍</p>

            {done ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>
                  <Check size={28} style={{ color: '#2D6A4F' }} />
                </div>
                <p className="font-black" style={{ color: '#2D6A4F' }}>¡Reporte enviado! +25 pts</p>
                <p className="text-xs text-gray-400">Gracias por ayudar a la comunidad 🦜</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {INCIDENT_TYPES.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => handleReport(inc)}
                    disabled={sending}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: '#FFFBF0', border: '1.5px solid #FECACA' }}
                  >
                    <span className="text-3xl">{inc.icon}</span>
                    <span className="text-sm font-bold" style={{ color: '#1F2937' }}>{inc.label}</span>
                  </button>
                ))}
              </div>
            )}
            {sending && !done && (
              <p className="text-center text-xs text-gray-400 mt-4">Enviando reporte y ubicación...</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}