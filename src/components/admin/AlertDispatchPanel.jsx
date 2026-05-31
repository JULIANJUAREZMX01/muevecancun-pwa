import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send, Bell, Users, CheckCircle, AlertTriangle } from 'lucide-react';

const ALERT_TYPES = [
  { value: 'delay', label: '⏱️ Demora', notifType: 'delay' },
  { value: 'cancellation', label: '🚫 Cancelación', notifType: 'incident' },
  { value: 'detour', label: '🔄 Desvío', notifType: 'schedule' },
  { value: 'info', label: 'ℹ️ Información', notifType: 'schedule' },
  { value: 'emergency', label: '🚨 Emergencia', notifType: 'incident' },
];

const SEVERITY = [
  { value: 'low', label: '🟢 Baja' },
  { value: 'medium', label: '🟡 Media' },
  { value: 'high', label: '🔴 Alta' },
];

const ROUTES = ['R1', 'R2', 'R13', 'R1A', 'R15', 'EXP'];

export default function AlertDispatchPanel() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'delay',
    severity: 'medium',
    route_number: '',
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const { data: subs = [] } = useQuery({
    queryKey: ['push-subs-count'],
    queryFn: () => base44.entities.PushSubscription.filter({ is_active: true }),
  });

  // Estimate affected subscribers based on route selection
  const affectedCount = form.route_number
    ? subs.filter(s =>
        !s.favorite_routes ||
        s.favorite_routes.length === 0 ||
        s.favorite_routes.includes(form.route_number)
      ).length
    : subs.length;

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    setSending(true);
    setResult(null);
    try {
      // 1. Create the alert in DB (this also triggers the entity automation)
      const alert = await base44.entities.Alert.create({
        ...form,
        is_active: true,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      });

      // 2. Also manually invoke dispatch function to ensure immediate delivery
      const res = await base44.functions.invoke('dispatchAlertNotification', { alert_id: alert.id });
      setResult({ ...res.data, alert_id: alert.id });

      // Reset form on success
      setForm({ title: '', message: '', type: 'delay', severity: 'medium', route_number: '' });
    } catch (e) {
      setResult({ error: e.message });
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      {/* Subscriber stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: '0 2px 8px rgba(45,106,79,0.08)' }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users size={16} style={{ color: '#2D6A4F' }} />
            <span className="text-xs font-black text-gray-500">SUSCRITOS</span>
          </div>
          <p className="text-2xl font-black" style={{ color: '#2D6A4F' }}>{subs.length}</p>
          <p className="text-xs text-gray-400">Total activos</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: '0 2px 8px rgba(45,106,79,0.08)' }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Bell size={16} style={{ color: '#F59E0B' }} />
            <span className="text-xs font-black text-gray-500">RECIBIRÁN</span>
          </div>
          <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>{affectedCount}</p>
          <p className="text-xs text-gray-400">{form.route_number ? `Ruta ${form.route_number}` : 'Todas las rutas'}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl p-5 space-y-4" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
        <h3 className="font-black text-base" style={{ color: '#2D6A4F' }}>📢 Nueva Alerta Push</h3>

        {/* Type */}
        <div>
          <p className="text-xs font-black text-gray-400 mb-2">TIPO DE ALERTA</p>
          <div className="flex flex-wrap gap-2">
            {ALERT_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setForm(p => ({ ...p, type: t.value }))}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: form.type === t.value ? '#2D6A4F' : '#F3F4F6',
                  color: form.type === t.value ? 'white' : '#6B7280',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <p className="text-xs font-black text-gray-400 mb-2">SEVERIDAD</p>
          <div className="flex gap-2">
            {SEVERITY.map(s => (
              <button
                key={s.value}
                onClick={() => setForm(p => ({ ...p, severity: s.value }))}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: form.severity === s.value ? '#2D6A4F' : '#F3F4F6',
                  color: form.severity === s.value ? 'white' : '#6B7280',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Route */}
        <div>
          <p className="text-xs font-black text-gray-400 mb-2">RUTA AFECTADA (opcional)</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setForm(p => ({ ...p, route_number: '' }))}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: !form.route_number ? '#2D6A4F' : '#F3F4F6',
                color: !form.route_number ? 'white' : '#6B7280',
              }}
            >
              Todas
            </button>
            {ROUTES.map(r => (
              <button
                key={r}
                onClick={() => setForm(p => ({ ...p, route_number: p.route_number === r ? '' : r }))}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: form.route_number === r ? '#2D6A4F' : '#F3F4F6',
                  color: form.route_number === r ? 'white' : '#6B7280',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-xs font-black text-gray-400 mb-1.5">TÍTULO</p>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Ej: Demora en Blvd. Kukulcán"
            maxLength={80}
            className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none"
            style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#1F2937' }}
          />
        </div>

        {/* Message */}
        <div>
          <p className="text-xs font-black text-gray-400 mb-1.5">MENSAJE</p>
          <textarea
            rows={3}
            value={form.message}
            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            placeholder="Describe el incidente, causa y duración estimada..."
            maxLength={200}
            className="w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none resize-none"
            style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#1F2937' }}
          />
          <p className="text-right text-xs text-gray-400 mt-1">{form.message.length}/200</p>
        </div>

        {/* Preview */}
        {form.title && (
          <div className="p-3 rounded-2xl" style={{ backgroundColor: '#1F2937' }}>
            <p className="text-xs font-black text-gray-400 mb-1.5">PREVIEW NOTIFICACIÓN</p>
            <div className="flex items-start gap-2">
              <span className="text-lg">🦜</span>
              <div>
                <p className="text-white font-bold text-xs">
                  {form.severity === 'high' ? '🚨 ' : form.severity === 'medium' ? '⚠️ ' : 'ℹ️ '}{form.title}
                </p>
                <p className="text-gray-300 text-xs mt-0.5">{form.message || '…'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !form.title || !form.message}
          className="w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{
            background: form.title && form.message ? 'linear-gradient(135deg, #2D6A4F, #52B788)' : '#E5E7EB',
            color: form.title && form.message ? 'white' : '#9CA3AF',
          }}
        >
          {sending
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
            : <><Send size={15} /> Enviar a {affectedCount} suscriptores</>
          }
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className="p-4 rounded-2xl flex items-start gap-3"
          style={{
            backgroundColor: result.error ? '#FEE2E2' : '#F0FDF4',
            border: `1.5px solid ${result.error ? '#FCA5A5' : '#BBF7D0'}`,
          }}
        >
          {result.error
            ? <AlertTriangle size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
            : <CheckCircle size={18} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
          }
          <div>
            {result.error ? (
              <p className="text-sm font-bold text-red-700">Error: {result.error}</p>
            ) : (
              <>
                <p className="text-sm font-black" style={{ color: '#065F46' }}>
                  ✅ Alerta enviada correctamente
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {result.mode === 'push'
                    ? `📲 Push enviado a ${result.sent} usuarios · ${result.failed} fallidos`
                    : `📱 Alerta guardada en la app (${result.targets_count} suscritos)`
                  }
                </p>
                {result.mode === 'in_app_only' && (
                  <p className="text-xs text-amber-600 mt-1">
                    💡 Para push real, configura VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en los secretos de la app.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}