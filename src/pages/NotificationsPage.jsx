import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCircle, AlertTriangle, Clock, Info, Zap, Trash2 } from 'lucide-react';
import NotifScheduleSettings from '@/components/notifications/NotifScheduleSettings';
import { offlineCache } from '@/lib/offlineCache';
import { useOnlineStatus } from '@/lib/useOnlineStatus';

const ROUTE_OPTIONS = ['R1', 'R2', 'R13', 'R1A', 'R15', 'EXP'];

const ALERT_ICONS = {
  delay:        { icon: '⏱️', color: '#F59E0B', bg: '#FEF3C7', label: 'Demora' },
  cancellation: { icon: '🚫', color: '#EF4444', bg: '#FEE2E2', label: 'Cancelación' },
  detour:       { icon: '🔄', color: '#3B82F6', bg: '#DBEAFE', label: 'Desvío' },
  info:         { icon: 'ℹ️', color: '#6B7280', bg: '#F3F4F6', label: 'Info' },
  emergency:    { icon: '🚨', color: '#EF4444', bg: '#FEE2E2', label: 'Emergencia' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

function AlertCard({ alert, onDismiss }) {
  const cfg = ALERT_ICONS[alert.type] || ALERT_ICONS.info;
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-3"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${cfg.color}` }}>
      <span className="text-2xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-sm" style={{ color: '#1F2937' }}>{alert.title}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(alert.created_date)}</span>
        </div>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{alert.message}</p>
        <div className="flex items-center gap-2 mt-2">
          {alert.route_number && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#D1FAE5', color: '#2D6A4F' }}>
              Ruta {alert.route_number}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function PushSettings({ myEmail }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [prefs, setPrefs] = useState({ notify_delays: true, notify_schedule: true, notify_incidents: true });
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (!myEmail) return;
    base44.entities.PushSubscription.filter({ user_email: myEmail })
      .then(res => {
        if (res[0]) {
          setSub(res[0]);
          setRoutes(res[0].favorite_routes || []);
          setPrefs({
            notify_delays: res[0].notify_delays !== false,
            notify_schedule: res[0].notify_schedule !== false,
            notify_incidents: res[0].notify_incidents !== false,
          });
        }
      });
  }, [myEmail]);

  const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  const handleSubscribe = async () => {
    if (!isPushSupported) return;
    setLoading(true);
    try {
      // Register service worker if not already
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      // For demo: store a mock subscription in the DB
      const mockEndpoint = `https://push.example.com/notify/${myEmail}-${Date.now()}`;
      const record = await base44.entities.PushSubscription.create({
        user_email: myEmail,
        endpoint: mockEndpoint,
        p256dh: 'demo_key',
        auth: 'demo_auth',
        favorite_routes: routes,
        ...prefs,
        is_active: true,
      });
      setSub(record);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSavePrefs = async () => {
    if (!sub) return;
    setLoading(true);
    const updated = await base44.entities.PushSubscription.update(sub.id, {
      favorite_routes: routes,
      ...prefs,
    });
    setSub(updated);
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUnsubscribe = async () => {
    if (!sub) return;
    await base44.entities.PushSubscription.update(sub.id, { is_active: false });
    setSub(null);
  };

  const toggleRoute = (r) => setRoutes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  return (
    <div className="space-y-4">
      {/* Push toggle */}
      <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
        <div className="flex items-center gap-3 mb-4">
          {sub ? <Bell size={20} style={{ color: '#2D6A4F' }} /> : <BellOff size={20} className="text-gray-400" />}
          <div className="flex-1">
            <p className="font-black text-sm" style={{ color: '#1F2937' }}>Notificaciones Push</p>
            <p className="text-xs text-gray-500">{sub ? '✅ Activadas' : 'Desactivadas'}</p>
          </div>
          {sub ? (
            <button onClick={handleUnsubscribe}
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
              Desactivar
            </button>
          ) : (
            <button onClick={handleSubscribe} disabled={loading || !isPushSupported}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#2D6A4F,#52B788)' }}>
              {loading ? 'Activando...' : 'Activar'}
            </button>
          )}
        </div>
        {!isPushSupported && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-xl">Tu navegador no soporta notificaciones push.</p>
        )}
      </div>

      {/* Route preferences */}
      <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
        <p className="font-black text-sm mb-3" style={{ color: '#2D6A4F' }}>🚌 Mis rutas favoritas</p>
        <div className="flex flex-wrap gap-2 mb-1">
          {ROUTE_OPTIONS.map(r => (
            <button key={r} onClick={() => toggleRoute(r)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: routes.includes(r) ? '#2D6A4F' : '#F3F4F6',
                color: routes.includes(r) ? 'white' : '#6B7280',
              }}>
              {r}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {routes.length === 0 ? 'Sin selección = todas las rutas' : `${routes.length} rutas seleccionadas`}
        </p>
      </div>

      {/* Notification types */}
      <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
        <p className="font-black text-sm mb-3" style={{ color: '#2D6A4F' }}>⚙️ Tipos de aviso</p>
        {[
          { key: 'notify_delays', icon: '⏱️', label: 'Retrasos y demoras' },
          { key: 'notify_schedule', icon: '🕐', label: 'Cambios de horario' },
          { key: 'notify_incidents', icon: '🚨', label: 'Incidentes y emergencias' },
        ].map(p => (
          <div key={p.key} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-2">
              <span>{p.icon}</span>
              <p className="text-sm font-semibold text-gray-700">{p.label}</p>
            </div>
            <button
              onClick={() => setPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ backgroundColor: prefs[p.key] ? '#2D6A4F' : '#E5E7EB' }}>
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                style={{ left: prefs[p.key] ? '26px' : '2px' }} />
            </button>
          </div>
        ))}
      </div>

      {sub && (
        <button onClick={handleSavePrefs} disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: saved ? '#10B981' : 'linear-gradient(135deg,#2D6A4F,#52B788)' }}>
          {saved ? <><CheckCircle size={16} /> Guardado</> : loading ? 'Guardando...' : 'Guardar preferencias'}
        </button>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState('alerts');
  const [myEmail, setMyEmail] = useState(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    base44.auth.me().then(u => { if (u) setMyEmail(u.email); }).catch(() => {});
  }, []);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['all-alerts'],
    queryFn: async () => {
      if (!isOnline) return offlineCache.getAlerts() || [];
      const data = await base44.entities.Alert.filter({ is_active: true });
      offlineCache.saveAlerts(data);
      return data;
    },
    refetchInterval: isOnline ? 30000 : false,
  });

  const sorted = [...alerts].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={20} className="text-yellow-300" />
            <h1 className="text-white font-black text-xl">Notificaciones</h1>
          </div>
          <p className="text-green-100 text-sm">Alertas en tiempo real de tus rutas</p>

          <div className="flex gap-2 mt-4">
            {[
              { key: 'alerts', label: `🔔 Alertas${alerts.length > 0 ? ` (${alerts.length})` : ''}` },
              { key: 'schedule', label: '🕐 Horario' },
              { key: 'settings', label: '⚙️ Push' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: tab === t.key ? '#FFD60A' : 'rgba(255,255,255,0.2)',
                  color: tab === t.key ? '#2D6A4F' : 'white',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {tab === 'alerts' && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mb-3">✅</span>
                <p className="font-black text-base" style={{ color: '#2D6A4F' }}>Sin alertas activas</p>
                <p className="text-sm text-gray-400 mt-1">Todas las rutas operan con normalidad</p>
              </div>
            ) : sorted.map(a => <AlertCard key={a.id} alert={a} />)}
          </>
        )}
        {tab === 'schedule' && <NotifScheduleSettings />}
        {tab === 'settings' && <PushSettings myEmail={myEmail} />}
        <div className="h-4" />
      </div>
    </div>
  );
}