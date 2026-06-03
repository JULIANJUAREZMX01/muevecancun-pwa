import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const POINTS_PER_TRIP = 10;

export default function MonthlyProgress({ userEmail }) {
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['my-trips', userEmail],
    queryFn: () => base44.entities.TripTelemetry.filter(
      userEmail ? { user_email: userEmail } : {}, '-created_date', 500
    ),
    enabled: true,
  });

  const chartData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], viajes: 0, puntos: 0 });
    }
    trips.forEach((t) => {
      const d = new Date(t.created_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) {
        bucket.viajes += 1;
        bucket.puntos += POINTS_PER_TRIP;
      }
    });
    return buckets;
  }, [trips]);

  const totalTrips = chartData.reduce((s, b) => s + b.viajes, 0);
  const totalPoints = chartData.reduce((s, b) => s + b.puntos, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5" style={{ boxShadow: '0 2px 16px rgba(45,106,79,0.08)' }}>
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={18} style={{ color: '#2D6A4F' }} />
        <h3 className="font-black text-base text-gray-900 dark:text-white">Mi progreso mensual</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">Últimos 6 meses · viajes y puntos</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 rounded-2xl" style={{ backgroundColor: '#F0FDF4' }}>
          <p className="font-black text-xl" style={{ color: '#2D6A4F' }}>{totalTrips}</p>
          <p className="text-[11px] text-gray-500">viajes (6 meses)</p>
        </div>
        <div className="text-center p-3 rounded-2xl" style={{ backgroundColor: '#FFF9E6' }}>
          <p className="font-black text-xl" style={{ color: '#92400E' }}>{totalPoints}</p>
          <p className="text-[11px] text-gray-500">puntos (6 meses)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-44 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
        </div>
      ) : totalTrips === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl">📊</span>
          <p className="text-sm font-bold text-gray-500">Aún no hay viajes registrados</p>
          <p className="text-xs text-gray-400">Registra viajes para ver tu progreso mes a mes</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #D1FAE5', fontSize: 12 }}
              formatter={(v, n) => [v, n === 'viajes' ? 'Viajes' : 'Puntos']}
            />
            <Bar dataKey="viajes" fill="#52B788" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="puntos" fill="#FFD60A" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#52B788' }} />
          <span className="text-xs text-gray-500">Viajes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FFD60A' }} />
          <span className="text-xs text-gray-500">Puntos</span>
        </div>
      </div>
    </div>
  );
}