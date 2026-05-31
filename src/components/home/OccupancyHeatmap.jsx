import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Flame, TrendingUp } from 'lucide-react';

const OCCUPANCY_WEIGHT = { empty: 0, low: 1, medium: 2, high: 3, full: 4 };
const OCCUPANCY_LABEL = { empty: 'Vacío', low: 'Poco', medium: 'Moderado', high: 'Lleno', full: 'Saturado' };

function heatColor(score) {
  // score 0..4 → green → yellow → red
  if (score < 1) return '#10B981';
  if (score < 2) return '#84CC16';
  if (score < 2.7) return '#F59E0B';
  if (score < 3.4) return '#F97316';
  return '#EF4444';
}

// Fallback sample data when DB has no live positions
const SAMPLE = [
  { route_number: 'R1', occupancy: 'high', next_stop: 'Km 12 ZH' },
  { route_number: 'R1', occupancy: 'full', next_stop: 'El Rey' },
  { route_number: 'R2', occupancy: 'low', next_stop: 'Centro' },
  { route_number: 'R13', occupancy: 'medium', next_stop: 'SM 64' },
  { route_number: 'EXP', occupancy: 'medium', next_stop: 'Km 12' },
];

export default function OccupancyHeatmap() {
  const { data: buses = [] } = useQuery({
    queryKey: ['heatmap-buses'],
    queryFn: () => base44.entities.BusPosition.filter({ is_active: true }),
    refetchInterval: 25000,
  });

  const source = buses.length > 0 ? buses : SAMPLE;

  // Aggregate average occupancy per route
  const byRoute = {};
  source.forEach(b => {
    const r = b.route_number || '?';
    if (!byRoute[r]) byRoute[r] = { total: 0, count: 0, busiest: b };
    const w = OCCUPANCY_WEIGHT[b.occupancy] ?? 2;
    byRoute[r].total += w;
    byRoute[r].count += 1;
    if (w > (OCCUPANCY_WEIGHT[byRoute[r].busiest?.occupancy] ?? 0)) byRoute[r].busiest = b;
  });

  const rows = Object.entries(byRoute)
    .map(([route, d]) => ({ route, score: d.total / d.count, busiest: d.busiest, count: d.count }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-3xl p-4" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} style={{ color: '#F97316' }} />
          <h2 className="font-black text-base" style={{ color: '#2D6A4F' }}>Saturación en Vivo</h2>
        </div>
        <div className="flex items-center gap-1">
          <div className="live-dot w-2 h-2 rounded-full bg-orange-400"></div>
          <span className="text-[10px] font-bold text-gray-400">TIEMPO REAL</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.map(({ route, score, busiest, count }) => {
          const pct = Math.min(100, (score / 4) * 100);
          const color = heatColor(score);
          return (
            <div key={route} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                style={{ backgroundColor: color }}>
                {route}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-600 truncate">{busiest?.next_stop || `${count} unidades`}</span>
                  <span className="text-[11px] font-black" style={{ color }}>{OCCUPANCY_LABEL[busiest?.occupancy] || 'Moderado'}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
        <TrendingUp size={12} className="text-gray-400" />
        <div className="flex items-center gap-2 flex-1">
          {[['Fluido', '#10B981'], ['Moderado', '#F59E0B'], ['Saturado', '#EF4444']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-[10px] text-gray-400 font-semibold">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}