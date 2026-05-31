import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Zap, MapPin, Bell, ChevronUp } from 'lucide-react';

const LEVELS = [
  { level: 1, name: 'Viajero Inicial', min: 0, max: 99, badge: '🚶', color: '#9CA3AF' },
  { level: 2, name: 'Pasajero Regular', min: 100, max: 299, badge: '🎫', color: '#F59E0B' },
  { level: 3, name: 'Explorador Urbano', min: 300, max: 599, badge: '🗺️', color: '#3B82F6' },
  { level: 4, name: 'Frecuentador Pro', min: 600, max: 999, badge: '⭐', color: '#8B5CF6' },
  { level: 5, name: 'Embajador Cancún', min: 1000, max: 1999, badge: '🏆', color: '#F4A261' },
  { level: 6, name: 'Leyenda del Metro', min: 2000, max: 99999, badge: '🦜', color: '#2D6A4F' },
];

const ACTIONS = [
  { key: 'trip', label: 'Registrar viaje', points: 10, icon: '🚌', desc: 'Cada vez que uses el transporte' },
  { key: 'report', label: 'Reportar incidente', points: 25, icon: '📣', desc: 'Ayuda a mejorar el servicio' },
  { key: 'alert_read', label: 'Leer alerta', points: 5, icon: '🔔', desc: 'Mantente informado' },
  { key: 'favorite_route', label: 'Añadir favorita', points: 20, icon: '⭐', desc: 'Guarda tus rutas preferidas' },
];

function LevelBar({ current, level }) {
  const next = LEVELS.find(l => l.level === level + 1);
  if (!next) return <div className="text-xs font-bold text-center py-1" style={{ color: '#2D6A4F' }}>¡Nivel máximo alcanzado! 🦜</div>;
  const pct = Math.min(100, Math.round(((current - LEVELS[level - 1].min) / (next.min - LEVELS[level - 1].min)) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} pts</span>
        <span>{next.min} pts para Nv.{next.level}</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2D6A4F, #52B788)' }} />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right">{pct}% al siguiente nivel</p>
    </div>
  );
}

export default function RewardsPage() {
  const [myRecord, setMyRecord] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('mi_perfil');

  const { data: leaderboard = [], refetch: refetchBoard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => base44.entities.UserPoints.list('-total_points', 20),
  });

  useEffect(() => {
    loadMyRecord();
  }, []);

  const loadMyRecord = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;
      const res = await base44.entities.UserPoints.filter({ user_email: user.email });
      setMyRecord(res[0] || null);
    } catch {}
  };

  const doAction = async (action) => {
    setLoadingAction(action);
    try {
      const res = await base44.functions.invoke('addPoints', { action });
      setMyRecord(res.data.record);
      refetchBoard();
      if (res.data.level_up) {
        setToast(`🎉 ¡Subiste al nivel ${res.data.new_level?.name}! ${res.data.new_level?.badge}`);
      } else {
        setToast(`+${res.data.points_added} puntos por ${ACTIONS.find(a => a.key === action)?.label}`);
      }
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast('Inicia sesión para ganar puntos');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoadingAction(null);
    }
  };

  const myLevel = myRecord ? LEVELS.find(l => l.level === myRecord.level) || LEVELS[0] : LEVELS[0];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-4 pt-12 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={20} className="text-yellow-300" />
            <h1 className="text-white font-black text-xl">Puntos & Niveles</h1>
          </div>
          <p className="text-green-100 text-sm">Gana puntos usando MueveCancún</p>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { key: 'mi_perfil', label: '👤 Mi Perfil' },
              { key: 'tabla', label: '🏆 Clasificación' },
              { key: 'ganar', label: '⚡ Ganar Puntos' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: tab === t.key ? '#FFD60A' : 'rgba(255,255,255,0.2)',
                  color: tab === t.key ? '#2D6A4F' : 'white',
                }}
              >
                {t.label}
              </button>
            ))}
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

      <div className="px-4 py-5">
        {/* MI PERFIL */}
        {tab === 'mi_perfil' && (
          <div className="space-y-4">
            {myRecord ? (
              <>
                {/* Level card */}
                <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 4px 20px rgba(45,106,79,0.12)' }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ backgroundColor: myLevel.color + '20', border: `3px solid ${myLevel.color}` }}
                    >
                      {myLevel.badge}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Nivel {myRecord.level}</p>
                      <p className="font-black text-lg" style={{ color: '#1F2937' }}>{myRecord.level_name}</p>
                      <p className="text-sm font-bold" style={{ color: '#2D6A4F' }}>{myRecord.total_points.toLocaleString()} puntos</p>
                    </div>
                  </div>
                  <LevelBar current={myRecord.total_points} level={myRecord.level} />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: '🚌', val: myRecord.trips_count || 0, label: 'Viajes' },
                    { icon: '📣', val: myRecord.reports_count || 0, label: 'Reportes' },
                    { icon: '🔔', val: myRecord.alerts_read || 0, label: 'Alertas leídas' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-3 text-center" style={{ boxShadow: '0 2px 8px rgba(45,106,79,0.08)' }}>
                      <p className="text-xl">{s.icon}</p>
                      <p className="font-black text-xl" style={{ color: '#2D6A4F' }}>{s.val}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                {myRecord.badges?.length > 0 && (
                  <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 8px rgba(45,106,79,0.08)' }}>
                    <p className="font-black text-sm mb-3" style={{ color: '#2D6A4F' }}>🏅 Insignias Obtenidas</p>
                    <div className="flex gap-3 flex-wrap">
                      {myRecord.badges.map((b, i) => (
                        <span key={i} className="text-3xl">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 rounded-3xl bg-white" style={{ border: '2px dashed #D1FAE5' }}>
                <p className="text-4xl mb-3">🚌</p>
                <p className="font-black text-base" style={{ color: '#2D6A4F' }}>¡Aún no tienes puntos!</p>
                <p className="text-sm text-gray-500 mt-1">Ve a "Ganar Puntos" para empezar</p>
              </div>
            )}
          </div>
        )}

        {/* TABLA DE CLASIFICACIÓN */}
        {tab === 'tabla' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 text-center">TOP 20 USUARIOS MueveCancún</p>
            {leaderboard.map((u, idx) => {
              const lvl = LEVELS.find(l => l.level === u.level) || LEVELS[0];
              const isMe = u.user_email === myRecord?.user_email;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    backgroundColor: isMe ? '#D1FAE5' : 'white',
                    border: isMe ? '2px solid #52B788' : '1px solid #F3F4F6',
                    boxShadow: '0 2px 8px rgba(45,106,79,0.06)',
                  }}
                >
                  <div className="w-8 text-center font-black text-lg" style={{ color: idx < 3 ? ['#FFD700','#C0C0C0','#CD7F32'][idx] : '#9CA3AF' }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </div>
                  <span className="text-2xl">{lvl.badge}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: '#1F2937' }}>
                      {u.user_name || u.user_email?.split('@')[0]}
                      {isMe && <span className="ml-1 text-xs font-black text-green-600">(Tú)</span>}
                    </p>
                    <p className="text-xs text-gray-500">Nv.{u.level} · {u.level_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm" style={{ color: '#2D6A4F' }}>{(u.total_points || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>
              );
            })}
            {leaderboard.length === 0 && (
              <div className="text-center py-10">
                <p className="text-4xl mb-2">🏆</p>
                <p className="text-gray-500 font-semibold">¡Sé el primero en el ranking!</p>
              </div>
            )}
          </div>
        )}

        {/* GANAR PUNTOS */}
        {tab === 'ganar' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: '#FFF9E6', border: '2px dashed #FFD60A' }}>
              <p className="text-xs font-black" style={{ color: '#92400E' }}>💡 PRIMER VIAJE = +50 puntos de bienvenida</p>
            </div>
            {ACTIONS.map(action => (
              <div
                key={action.key}
                className="bg-white rounded-2xl p-4 flex items-center gap-4"
                style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}
              >
                <span className="text-3xl">{action.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: '#1F2937' }}>{action.label}</p>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#2D6A4F' }}>+{action.points} pts</span>
                  <button
                    onClick={() => doAction(action.key)}
                    disabled={loadingAction === action.key}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: loadingAction === action.key ? '#E5E7EB' : 'linear-gradient(135deg, #2D6A4F, #52B788)',
                      color: loadingAction === action.key ? '#9CA3AF' : 'white',
                    }}
                  >
                    {loadingAction === action.key ? '...' : '¡Ganar!'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}