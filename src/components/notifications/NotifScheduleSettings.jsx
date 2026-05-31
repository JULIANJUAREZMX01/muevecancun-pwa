import { useState, useEffect } from 'react';
import { Clock, Moon, Sun, CheckCircle } from 'lucide-react';
import { offlineCache } from '@/lib/offlineCache';

const DEFAULT_SCHEDULE = {
  enabled: true,
  quiet_start: '22:00',
  quiet_end: '07:00',
  alert_on_delay_min: 10,       // minutes threshold for delay alerts
  alert_routes: [],
  alert_weather: true,
  alert_schedule_changes: true,
  alert_delays: true,
};

const DELAY_THRESHOLDS = [
  { value: 5, label: '5 min o más' },
  { value: 10, label: '10 min o más' },
  { value: 15, label: '15 min o más' },
  { value: 20, label: '20 min o más' },
];

const ROUTE_OPTIONS = ['R1', 'R2', 'R13', 'R1A', 'R15', 'EXP'];

export default function NotifScheduleSettings() {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cached = offlineCache.getNotifSchedule();
    if (cached) setSchedule({ ...DEFAULT_SCHEDULE, ...cached });
  }, []);

  const save = () => {
    offlineCache.saveNotifSchedule(schedule);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleRoute = (r) => {
    setSchedule(prev => ({
      ...prev,
      alert_routes: prev.alert_routes.includes(r)
        ? prev.alert_routes.filter(x => x !== r)
        : [...prev.alert_routes, r],
    }));
  };

  const isQuietNow = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const current = h * 60 + m;
    const [qsh, qsm] = schedule.quiet_start.split(':').map(Number);
    const [qeh, qem] = schedule.quiet_end.split(':').map(Number);
    const qs = qsh * 60 + qsm;
    const qe = qeh * 60 + qem;
    if (qs > qe) return current >= qs || current <= qe; // overnight
    return current >= qs && current <= qe;
  };

  const quietNow = isQuietNow();

  return (
    <div className="space-y-4">
      {/* Active schedule status */}
      {quietNow && (
        <div className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ backgroundColor: '#EDE9FE', border: '1px solid #C4B5FD' }}>
          <Moon size={16} style={{ color: '#7C3AED', flexShrink: 0 }} />
          <p className="text-xs font-semibold" style={{ color: '#5B21B6' }}>
            Horario silencioso activo ahora ({schedule.quiet_start}–{schedule.quiet_end})
          </p>
        </div>
      )}

      {/* Master toggle */}
      <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-sm" style={{ color: '#1F2937' }}>Alertas personalizadas</p>
            <p className="text-xs text-gray-400 mt-0.5">Recibe avisos de tus rutas favoritas</p>
          </div>
          <button
            onClick={() => setSchedule(p => ({ ...p, enabled: !p.enabled }))}
            className="w-12 h-6 rounded-full transition-all relative"
            style={{ backgroundColor: schedule.enabled ? '#2D6A4F' : '#E5E7EB' }}>
            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
              style={{ left: schedule.enabled ? '26px' : '2px' }} />
          </button>
        </div>
      </div>

      {schedule.enabled && (
        <>
          {/* Quiet hours */}
          <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Moon size={16} style={{ color: '#7C3AED' }} />
              <p className="font-black text-sm" style={{ color: '#1F2937' }}>Horario silencioso</p>
            </div>
            <p className="text-xs text-gray-400 mb-3">Sin notificaciones durante este horario</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-1">INICIO</p>
                <input
                  type="time"
                  value={schedule.quiet_start}
                  onChange={e => setSchedule(p => ({ ...p, quiet_start: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none"
                  style={{ backgroundColor: '#F0FDF4', color: '#2D6A4F', border: '1.5px solid #BBF7D0' }}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-1">FIN</p>
                <input
                  type="time"
                  value={schedule.quiet_end}
                  onChange={e => setSchedule(p => ({ ...p, quiet_end: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none"
                  style={{ backgroundColor: '#F0FDF4', color: '#2D6A4F', border: '1.5px solid #BBF7D0' }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: '#F9FAFB' }}>
              <Sun size={12} style={{ color: '#F59E0B' }} />
              <p className="text-[10px] text-gray-500">
                Ahora: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                {quietNow ? ' · 🌙 En silencio' : ' · 🔔 Activo'}
              </p>
            </div>
          </div>

          {/* Delay threshold */}
          <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} style={{ color: '#F59E0B' }} />
              <p className="font-black text-sm" style={{ color: '#1F2937' }}>Alertar cuando retraso sea</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DELAY_THRESHOLDS.map(t => (
                <button key={t.value}
                  onClick={() => setSchedule(p => ({ ...p, alert_on_delay_min: t.value }))}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all"
                  style={{
                    backgroundColor: schedule.alert_on_delay_min === t.value ? '#2D6A4F' : '#F3F4F6',
                    color: schedule.alert_on_delay_min === t.value ? 'white' : '#6B7280',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Route filter */}
          <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
            <p className="font-black text-sm mb-1" style={{ color: '#1F2937' }}>🚌 Rutas prioritarias</p>
            <p className="text-xs text-gray-400 mb-3">Sólo recibirás alertas de estas rutas</p>
            <div className="flex flex-wrap gap-2">
              {ROUTE_OPTIONS.map(r => (
                <button key={r} onClick={() => toggleRoute(r)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    backgroundColor: schedule.alert_routes.includes(r) ? '#2D6A4F' : '#F3F4F6',
                    color: schedule.alert_routes.includes(r) ? 'white' : '#6B7280',
                  }}>
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              {schedule.alert_routes.length === 0 ? 'Sin selección = todas las rutas' : `${schedule.alert_routes.length} rutas seleccionadas`}
            </p>
          </div>

          {/* Alert types */}
          <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
            <p className="font-black text-sm mb-3" style={{ color: '#1F2937' }}>🔔 Tipos de alerta</p>
            {[
              { key: 'alert_delays', icon: '⏱️', label: 'Retrasos importantes', desc: `≥ ${schedule.alert_on_delay_min} min` },
              { key: 'alert_schedule_changes', icon: '🕐', label: 'Cambios de horario', desc: 'Modificaciones de rutas' },
              { key: 'alert_weather', icon: '🌧️', label: 'Alertas de clima', desc: 'Lluvia intensa, huracanes' },
            ].map(p => (
              <div key={p.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <p className="text-sm font-semibold text-gray-700">{p.label}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 ml-6">{p.desc}</p>
                </div>
                <button
                  onClick={() => setSchedule(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                  className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
                  style={{ backgroundColor: schedule[p.key] ? '#2D6A4F' : '#E5E7EB' }}>
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                    style={{ left: schedule[p.key] ? '26px' : '2px' }} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Save button */}
      <button onClick={save}
        className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
        style={{ background: saved ? '#10B981' : 'linear-gradient(135deg,#2D6A4F,#52B788)' }}>
        {saved ? <><CheckCircle size={16} /> Guardado localmente</> : '💾 Guardar configuración'}
      </button>

      <p className="text-center text-[10px] text-gray-400">
        La configuración se guarda en tu dispositivo y funciona sin conexión
      </p>
    </div>
  );
}