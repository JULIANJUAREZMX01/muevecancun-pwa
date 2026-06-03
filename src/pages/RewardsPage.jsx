import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Zap, Bus, FileText, Bell, ChevronRight, Award } from 'lucide-react';
import WeeklyChallenges from '@/components/rewards/WeeklyChallenges';
import MonthlyProgress from '@/components/rewards/MonthlyProgress';
import ThemeToggle from '@/components/settings/ThemeToggle';

const LEVELS = [
  { level: 1, name: 'Viajero Inicial',    min: 0,    badge: '🚶', color: '#9CA3AF' },
  { level: 2, name: 'Pasajero Regular',   min: 100,  badge: '🎫', color: '#10B981' },
  { level: 3, name: 'Explorador Urbano',  min: 300,  badge: '🗺️', color: '#3B82F6' },
  { level: 4, name: 'Frecuentador Pro',   min: 600,  badge: '⭐', color: '#8B5CF6' },
  { level: 5, name: 'Embajador Cancún',   min: 1000, badge: '🏆', color: '#F59E0B' },
  { level: 6, name: 'Leyenda del Metro',  min: 2000, badge: '🦜', color: '#EF4444' },
];

function getNextLevel(points) {
  for (const lvl of LEVELS) {
    if (points < lvl.min) return lvl;
  }
  return null;
}

function getCurrentLevel(points) {
  let cur = LEVELS[0];
  for (const lvl of LEVELS) { if (points >= lvl.min) cur = lvl; }
  return cur;
}

function LevelBadge({ level, size = 'md' }) {
  const lvl = LEVELS.find(l => l.level === level) || LEVELS[0];
  const sz = size === 'lg' ? 'w-16 h-16 text-3xl' : 'w-10 h-10 text-xl';
  return (
    <div className={`${sz} rounded-2xl flex items-center justify-center flex-shrink-0`}
      style={{ background: `${lvl.color}20`, border: `2px solid ${lvl.color}40` }}>
      {lvl.badge}
    </div>
  );
}

function ProgressBar({ current, min, max, color }) {
  const pct = max ? Math.min(100, ((current - min) / (max - min)) * 100) : 100;
  return (
    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function MyProfile({ record, onAction, actionLoading }) {
  if (!record) return (
    <div className="bg-white rounded-3xl p-6 text-center" style={{ boxShadow: '0 2px 16px rgba(45,106,79,0.08)' }}>
      <span className="text-4xl">🚶</span>
      <p className="font-bold text-gray-600 mt-2">Aún no tienes puntos</p>
      <p className="text-xs text-gray-400 mt-1">Registra tu primer viaje para comenzar</p>
      <button onClick={() => onAction('trip')} disabled={actionLoading}
        className="mt-4 px-6 py-2.5 rounded-2xl font-bold text-sm text-white"
        style={{ background: 'linear-gradient(135deg,#2D6A4F,#52B788)' }}>
        {actionLoading ? 'Registrando...' : '🚌 Registrar viaje (+10 pts)'}
      </button>
    </div>
  );

  const cur = getCurrentLevel(record.total_points);
  const next = getNextLevel(record.total_points);

  return (
    <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 16px rgba(45,106,79,0.08)' }}>
      <div className="flex items-center gap-4 mb-4">
        <LevelBadge level={record.level} size="lg" />
        <div className="flex-1">
          <p className="font-black text-lg" style={{ color: '#1F2937' }}>{record.user_name || 'Tú'}</p>
          <p className="text-sm font-bold" style={{ color: cur.color }}>{cur.badge} {cur.name}</p>
          <p className="text-2xl font-black mt-1" style={{ color: '#2D6A4F' }}>
            {record.total_points?.toLocaleString()} <span className="text-sm font-semibold text-gray-400">pts</span>
          </p>
        </div>
      </div>

      {next && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{record.total_points} pts</span>
            <span>Siguiente: {next.badge} {next.name} — {next.min} pts</span>
          </div>
          <ProgressBar current={record.total_points} min={cur.min} max={next.min} color={cur.color} />
          <p className="text-xs text-gray-400 mt-1">{next.min - record.total_points} pts para subir de nivel</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: <Bus size={14}/>, label: 'Viajes', value: record.trips_count || 0 },
          { icon: <FileText size={14}/>, label: 'Reportes', value: record.reports_count || 0 },
          { icon: <Bell size={14}/>, label: 'Alertas leídas', value: record.alerts_read || 0 },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-2xl bg-gray-50">
            <div className="flex justify-center mb-0.5 text-gray-400">{s.icon}</div>
            <p className="font-black text-base" style={{ color: '#2D6A4F' }}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {record.badges?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-black text-gray-400 mb-2">MIS INSIGNIAS</p>
          <div className="flex gap-2 flex-wrap">
            {record.badges.map((b, i) => (
              <span key={i} className="text-2xl">{b}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {[
          { action: 'trip', label: '🚌 Registrar viaje', pts: '+10' },
          { action: 'report', label: '📝 Reportar incidente', pts: '+25' },
        ].map(a => (
          <button key={a.action} onClick={() => onAction(a.action)} disabled={actionLoading}
            className="py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#F0FDF4', color: '#2D6A4F', border: '1.5px solid #BBF7D0' }}>
            {a.label} <span className="font-black" style={{ color: '#52B788' }}>{a.pts}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Leaderboard({ data, myEmail }) {
  const sorted = [...data].sort((a, b) => (b.total_points || 0) - (a.total_points || 0)).slice(0, 20);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-2">
      {sorted.map((user, idx) => {
        const isMe = user.user_email === myEmail;
        const lvl = getCurrentLevel(user.total_points || 0);
        return (
          <div key={user.id}
            className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{
              backgroundColor: isMe ? '#F0FDF4' : 'white',
              border: isMe ? '2px solid #BBF7D0' : '1px solid #F3F4F6',
              boxShadow: '0 1px 6px rgba(45,106,79,0.05)',
            }}>
            <span className="text-xl w-8 text-center flex-shrink-0">
              {medals[idx] || <span className="text-sm font-black text-gray-400">#{idx + 1}</span>}
            </span>
            {!medals[idx] && <span className="text-sm font-black text-gray-400 w-8 text-center -ml-8">#{idx + 1}</span>}
            <LevelBadge level={user.level || 1} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: isMe ? '#2D6A4F' : '#1F2937' }}>
                {user.user_name || user.user_email?.split('@')[0]} {isMe && '(Tú)'}
              </p>
              <p className="text-xs" style={{ color: lvl.color }}>{lvl.badge} {lvl.name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-black text-base" style={{ color: '#2D6A4F' }}>{(user.total_points || 0).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">puntos</p>
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && (
        <div className="text-center py-10">
          <span className="text-4xl">🏆</span>
          <p className="text-gray-400 font-semibold mt-2">Sé el primero en el ranking</p>
        </div>
      )}
    </div>
  );
}

export default function RewardsPage() {
  const [tab, setTab] = useState('profile');
  const [myEmail, setMyEmail] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { if (u) setMyEmail(u.email); }).catch(() => {});
  }, []);

  const { data: allUsers = [], refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => base44.entities.UserPoints.list('-total_points', 50),
    refetchInterval: 60000,
  });

  const myRecord = allUsers.find(u => u.user_email === myEmail);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      const res = await base44.functions.invoke('addPoints', { action });
      const d = res.data;
      if (d?.success) {
        const msg = d.level_up
          ? `🎉 ¡Subiste al nivel ${d.new_level?.name}! +${d.points_added} pts`
          : `+${d.points_added} puntos añadidos`;
        setToast(msg);
        refetch();
      }
    } catch (e) {
      setToast('Error al registrar puntos');
    } finally {
      setActionLoading(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={20} className="text-yellow-300" />
            <h1 className="text-white font-black text-xl">Puntos & Ranking</h1>
          </div>
          <p className="text-green-100 text-sm">Gana puntos usando el transporte 🚌</p>

          <div className="flex gap-2 mt-4">
            {[{ key: 'profile', label: '👤 Mi Perfil' }, { key: 'challenges', label: '⚡ Desafíos' }, { key: 'board', label: '🏆 Tabla' }].map(t => (
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

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg,#2D6A4F,#52B788)', maxWidth: '320px' }}>
          {toast}
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {tab === 'profile' && (
          <>
            <MyProfile record={myRecord} onAction={handleAction} actionLoading={actionLoading} />
            <MonthlyProgress userEmail={myEmail} />
            <ThemeToggle />
          </>
        )}
        {tab === 'challenges' && (
          <WeeklyChallenges userRecord={myRecord} onPointsEarned={refetch} />
        )}
        {tab === 'board' && (
          <Leaderboard data={allUsers} myEmail={myEmail} />
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}