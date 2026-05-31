import { useState } from 'react';
import { base44 } from '@/api/base44Client';

const CHALLENGES = [
  {
    id: 'streak_5',
    icon: '🔥',
    title: 'Racha Viajera',
    description: 'Viaja 5 días seguidos en transporte público',
    reward_pts: 150,
    reward_badge: '🔥',
    action: 'streak',
    target: 5,
    field: 'consecutive_days',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
  {
    id: 'peak_report',
    icon: '⏰',
    title: 'Reportero de Hora Pico',
    description: 'Realiza un reporte de incidente entre 7-9am o 5-8pm',
    reward_pts: 75,
    reward_badge: '⏰',
    action: 'report',
    target: 1,
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  {
    id: 'explorer_3',
    icon: '🗺️',
    title: 'Explorador de Rutas',
    description: 'Viaja en 3 rutas diferentes en una semana',
    reward_pts: 100,
    reward_badge: '🗺️',
    action: 'trip',
    target: 3,
    color: '#3B82F6',
    bg: '#DBEAFE',
  },
  {
    id: 'reporter_5',
    icon: '📝',
    title: 'Corresponsal Urbano',
    description: 'Realiza 5 reportes de incidentes esta semana',
    reward_pts: 200,
    reward_badge: '📋',
    action: 'report',
    target: 5,
    field: 'reports_count',
    color: '#8B5CF6',
    bg: '#EDE9FE',
  },
  {
    id: 'early_bird',
    icon: '🌅',
    title: 'Madrugador',
    description: 'Registra 3 viajes antes de las 8am',
    reward_pts: 80,
    reward_badge: '🌅',
    action: 'trip',
    target: 3,
    color: '#F4A261',
    bg: '#FFF3E0',
  },
  {
    id: 'week_10',
    icon: '🏅',
    title: 'Campeón Semanal',
    description: 'Acumula 10 viajes en una sola semana',
    reward_pts: 250,
    reward_badge: '🏅',
    action: 'trip',
    target: 10,
    field: 'trips_count',
    color: '#2D6A4F',
    bg: '#D1FAE5',
  },
];

function ChallengeCard({ challenge, userRecord, onClaim, claiming }) {
  // Simulate progress based on user data
  const getProgress = () => {
    if (!userRecord) return 0;
    if (challenge.field === 'consecutive_days') return Math.min(userRecord.consecutive_days || 0, challenge.target);
    if (challenge.field === 'trips_count') return Math.min((userRecord.trips_count || 0) % 10, challenge.target);
    if (challenge.field === 'reports_count') return Math.min((userRecord.reports_count || 0) % 5, challenge.target);
    return 0;
  };

  const progress = getProgress();
  const pct = Math.min(100, (progress / challenge.target) * 100);
  const completed = pct >= 100;

  // Check if badge already earned
  const alreadyEarned = userRecord?.badges?.includes(challenge.reward_badge);

  return (
    <div
      className="bg-white rounded-3xl p-4 relative overflow-hidden"
      style={{
        boxShadow: '0 2px 16px rgba(45,106,79,0.08)',
        border: completed ? `2px solid ${challenge.color}` : '1px solid #F3F4F6',
        opacity: alreadyEarned ? 0.7 : 1,
      }}
    >
      {alreadyEarned && (
        <div className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: challenge.bg, color: challenge.color }}>
          ✅ Completado
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: challenge.bg }}>
          {challenge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-black text-sm" style={{ color: '#1F2937' }}>{challenge.title}</p>
          </div>
          <p className="text-xs text-gray-500 mb-2 leading-relaxed">{challenge.description}</p>

          {/* Progress bar */}
          {!alreadyEarned && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{progress}/{challenge.target}</span>
                <span className="font-bold" style={{ color: challenge.color }}>+{challenge.reward_pts} pts</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: challenge.color }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{challenge.reward_badge}</span>
              <span className="text-xs font-bold" style={{ color: challenge.color }}>Insignia exclusiva</span>
            </div>
            {completed && !alreadyEarned && (
              <button
                onClick={() => onClaim(challenge)}
                disabled={claiming}
                className="px-3 py-1.5 rounded-xl text-xs font-black text-white"
                style={{ background: `linear-gradient(135deg, ${challenge.color}, ${challenge.color}CC)` }}
              >
                {claiming ? '...' : '🎁 Reclamar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyChallenges({ userRecord, onPointsEarned }) {
  const [claiming, setClaiming] = useState(null);
  const [toast, setToast] = useState(null);

  const handleClaim = async (challenge) => {
    setClaiming(challenge.id);
    try {
      const res = await base44.functions.invoke('addPoints', {
        action: challenge.action,
        bonus: challenge.reward_pts,
        badge: challenge.reward_badge,
      });
      if (res.data?.success) {
        setToast(`🎉 ¡Desafío completado! +${challenge.reward_pts} pts y ${challenge.reward_badge}`);
        onPointsEarned?.();
      }
    } catch (e) {
      setToast('Error al reclamar el desafío');
    } finally {
      setClaiming(null);
      setTimeout(() => setToast(null), 3500);
    }
  };

  // Days remaining in week
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysLeft = 7 - dayOfWeek;

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg,#2D6A4F,#52B788)', maxWidth: '320px', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-black text-base" style={{ color: '#2D6A4F' }}>⚡ Desafíos Semanales</p>
          <p className="text-xs text-gray-400">Se reinician en {daysLeft} día{daysLeft !== 1 ? 's' : ''}</p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
          🏅 {CHALLENGES.length} retos activos
        </div>
      </div>

      {/* Info banner */}
      <div className="p-3 rounded-2xl mb-3 flex items-center gap-3"
        style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <span className="text-xl">🦜</span>
        <p className="text-xs" style={{ color: '#047857' }}>
          Completa los desafíos para ganar insignias exclusivas y puntos extra. ¡Las insignias no se pueden obtener de otra forma!
        </p>
      </div>

      {/* Challenges grid */}
      <div className="space-y-3">
        {CHALLENGES.map(ch => (
          <ChallengeCard
            key={ch.id}
            challenge={ch}
            userRecord={userRecord}
            onClaim={handleClaim}
            claiming={claiming === ch.id}
          />
        ))}
      </div>
    </div>
  );
}