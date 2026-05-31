import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Send, CheckCircle, AlertTriangle, Zap, Clock } from 'lucide-react';

const ROUTES = ['R1', 'R2', 'R13', 'R1A', 'R15', 'EXP'];

const NOTIF_TYPES = [
  { key: 'delay', icon: '⏱️', label: 'Retrasos', desc: 'Aviso cuando tu ruta tenga demora' },
  { key: 'schedule', icon: '🕐', label: 'Cambios de horario', desc: 'Modificaciones en el servicio' },
  { key: 'incident', icon: '🚨', label: 'Incidentes', desc: 'Accidentes, cortes de ruta o emergencias' },
];

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-12 h-6 rounded-full transition-all flex items-center px-0.5"
      style={{ backgroundColor: value ? '#2D6A4F' : '#D1D5DB' }}
    >
      <div
        className="w-5 h-5 bg-white rounded-full shadow transition-transform"
        style={{ transform: value ? 'translateX(24px)' : 'translateX(0)' }}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [pushSupported, setPushSupported] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [prefs, setPrefs] = useState({ notify_delays: true, notify_schedule: true, notify_incidents: true });
  const [favoriteRoutes, setFavoriteRoutes] = useState([]);
  const [toast, setToast] = useState(null);
  const [adminPanel, setAdminPanel] = useState(false);
  const [notifForm, setNotifForm] = useState({ route_number: 'R1', type: 'delay', title: '', message: '' });
  const [sendingNotif, setSendingNotif] = useState(false);

  const qc = useQueryClient();

  const { data: recentAlerts = [] } = useQuery({
    queryKey: ['recent-alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date', 10),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushSupported(false);
    }
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u) loadSubscription(u.email);
    } catch {}
  };

  const loadSubscription = async (email) => {
    try {
      const res = await base44.entities.PushSubscription.filter({ user_email: email });
      if (res[0]) {
        setSubscription(res[0]);
        setPrefs({
          notify_delays: res[0].notify_delays !== false,
          notify_schedule: res[0].notify_schedule !== false,
          notify_incidents: res[0].notify_incidents !== false,
        });
        setFavoriteRoutes(res[0].favorite_routes || []);
      }
    } catch {}
  };

  const toggleRoute = (route) => {
    setFavoriteRoutes(prev =>
      prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route]
    );
  };

  const subscribeToNotifications = async () => {
    if (!user) { showToast('Inicia sesión para activar notificaciones'); return; }
    setIsSubscribing(true);
    try {
      let endpoint = `simulated-endpoint-${user.email}-${Date.now()}`;
      let p256dh = 'simulated-p256dh';
      let auth = 'simulated-auth';

      // Try real browser push
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          showToast('🔔 Notificaciones activadas en el navegador');
        }
      }

      const data = {
        user_email: user.email,
        endpoint,
        p256dh,
        auth,
        favorite_routes: favoriteRoutes,
        notify_delays: prefs.notify_delays,
        notify_schedule: prefs.notify_schedule,
        notify_incidents: prefs.notify_incidents,
        is_active: true,
      };

      let sub;
      if (subscription) {
        sub = await base44.entities.PushSubscription.update(subscription.id, data);
      } else {
        sub = await base44.entities.PushSubscription.create(data);
      }
      setSubscription(sub);
      showToast('✅ Preferencias de notificaciones guardadas');
    } catch (e) {
      showToast('Error al guardar preferencias: ' + e.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;
    await base44.entities.PushSubscription.update(subscription.id, { is_active: false });
    setSubscription(null);
    showToast('🔕 Notificaciones desactivadas');
  };

  const savePrefs = async () => {
    if (!subscription) { subscribeToNotifications(); return; }
    await base44.entities.PushSubscription.update(subscription.id, {
      ...prefs,
      favorite_routes: favoriteRoutes,
    });
    showToast('✅ Preferencias actualizadas');
  };

  const sendTestNotification = async () => {
    setSendingNotif(true);
    try {
      const res = await base44.functions.invoke('sendPushNotification', notifForm);
      showToast(`📨 Notificación enviada a ${res.data?.targets_count || 0} usuarios`);
      qc.invalidateQueries(['recent-alerts']);
    } catch (e) {
      showToast('Error: ' + e.message);
    } finally {
      setSendingNotif(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const isActive = subscription?.is_active;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-4 pt-12 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bell size={20} className="text-yellow-300" />
                <h1 className="text-white font-black text-xl">Notificaciones</h1>
              </div>
              <p className="text-green-100 text-sm">Alertas en tiempo real de tus rutas</p>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: isActive ? '#FFD60A' : 'rgba(255,255,255,0.2)' }}
            >
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-700 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-bold" style={{ color: isActive ? '#2D6A4F' : 'white' }}>
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', maxWidth: '90vw' }}
        >
          {toast}
        </div>
      )}

      <div className="px-4 py-5 space-y-5">

        {/* Subscribe / Unsubscribe CTA */}
        <div
          className="p-5 rounded-3xl"
          style={{
            background: isActive
              ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)'
              : 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            border: `2px solid ${isActive ? '#52B788' : '#F59E0B'}`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{isActive ? '🔔' : '🔕'}</span>
            <div>
              <p className="font-black text-base" style={{ color: isActive ? '#065F46' : '#92400E' }}>
                {isActive ? 'Notificaciones Activadas' : 'Activa tus notificaciones'}
              </p>
              <p className="text-xs" style={{ color: isActive ? '#047857' : '#B45309' }}>
                {isActive ? 'Recibirás avisos de tus rutas favoritas' : 'Entérate de retrasos e incidentes al instante'}
              </p>
            </div>
          </div>
          {isActive ? (
            <button
              onClick={unsubscribe}
              className="w-full py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: 'white', color: '#991B1B' }}
            >
              <BellOff size={16} /> Desactivar
            </button>
          ) : (
            <button
              onClick={subscribeToNotifications}
              disabled={isSubscribing}
              className="w-full py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', color: 'white' }}
            >
              <Bell size={16} /> {isSubscribing ? 'Activando...' : 'Activar notificaciones'}
            </button>
          )}
        </div>

        {/* Favorite Routes */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <p className="font-black text-sm mb-3" style={{ color: '#2D6A4F' }}>📍 Rutas a monitorear</p>
          <div className="flex flex-wrap gap-2">
            {ROUTES.map(r => (
              <button
                key={r}
                onClick={() => toggleRoute(r)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: favoriteRoutes.includes(r) ? '#2D6A4F' : '#F3F4F6',
                  color: favoriteRoutes.includes(r) ? 'white' : '#6B7280',
                }}
              >
                {favoriteRoutes.includes(r) && '✓ '}{r}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Sin selección = todas las rutas</p>
        </div>

        {/* Notification type prefs */}
        <div className="bg-white rounded-2xl p-4 space-y-4" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <p className="font-black text-sm" style={{ color: '#2D6A4F' }}>⚙️ Tipo de avisos</p>
          {NOTIF_TYPES.map(t => (
            <div key={t.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
              </div>
              <ToggleSwitch
                value={prefs[`notify_${t.key}s`] ?? prefs[`notify_${t.key}`] ?? true}
                onChange={(v) => setPrefs(prev => ({ ...prev, [`notify_${t.key}s`]: v, [`notify_${t.key}`]: v }))}
              />
            </div>
          ))}
          <button
            onClick={savePrefs}
            className="w-full py-3 rounded-2xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', color: 'white' }}
          >
            Guardar preferencias
          </button>
        </div>

        {/* Admin: Send notification */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
          <button
            onClick={() => setAdminPanel(!adminPanel)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <Send size={16} style={{ color: '#2D6A4F' }} />
              <span className="font-black text-sm" style={{ color: '#2D6A4F' }}>Enviar notificación (admin)</span>
            </div>
            <span className="text-gray-400">{adminPanel ? '▲' : '▼'}</span>
          </button>
          {adminPanel && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Ruta</label>
                  <select
                    value={notifForm.route_number}
                    onChange={e => setNotifForm(p => ({ ...p, route_number: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 outline-none"
                    style={{ color: '#2D6A4F' }}
                  >
                    {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tipo</label>
                  <select
                    value={notifForm.type}
                    onChange={e => setNotifForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 outline-none"
                    style={{ color: '#2D6A4F' }}
                  >
                    <option value="delay">Retraso</option>
                    <option value="schedule">Horario</option>
                    <option value="incident">Incidente</option>
                  </select>
                </div>
              </div>
              <input
                placeholder="Título del aviso"
                value={notifForm.title}
                onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 outline-none"
                style={{ color: '#1F2937' }}
              />
              <textarea
                placeholder="Mensaje detallado..."
                value={notifForm.message}
                onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 outline-none h-20 resize-none"
                style={{ color: '#1F2937' }}
              />
              <button
                onClick={sendTestNotification}
                disabled={sendingNotif || !notifForm.title || !notifForm.message}
                className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  background: sendingNotif ? '#E5E7EB' : 'linear-gradient(135deg, #F4A261, #E76F51)',
                  color: sendingNotif ? '#9CA3AF' : 'white',
                }}
              >
                <Send size={14} />
                {sendingNotif ? 'Enviando...' : 'Enviar a usuarios suscritos'}
              </button>
            </div>
          )}
        </div>

        {/* Recent alerts */}
        <div>
          <p className="font-black text-sm mb-3" style={{ color: '#2D6A4F' }}>📋 Alertas Recientes</p>
          <div className="space-y-2">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">Sin alertas recientes</div>
            ) : recentAlerts.map(a => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white"
                style={{
                  borderLeft: `4px solid ${a.severity === 'high' ? '#EF4444' : a.severity === 'medium' ? '#F59E0B' : '#10B981'}`,
                  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                }}
              >
                <span className="text-xl mt-0.5">{a.type === 'delay' ? '⏱️' : a.type === 'emergency' ? '🚨' : a.type === 'info' ? 'ℹ️' : '⚠️'}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
                  {a.route_number && (
                    <span className="text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#2D6A4F' }}>
                      Ruta {a.route_number}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}