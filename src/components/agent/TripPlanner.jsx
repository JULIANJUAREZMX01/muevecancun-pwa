import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Navigation, ArrowRight, Clock, DollarSign, Repeat, Footprints, Bus, Flag, Lightbulb } from 'lucide-react';

const STEP_ICON = {
  walk: { icon: Footprints, color: '#6B7280', bg: '#F3F4F6' },
  bus: { icon: Bus, color: '#2D6A4F', bg: '#D1FAE5' },
  transfer: { icon: Repeat, color: '#92400E', bg: '#FEF3C7' },
  arrive: { icon: Flag, color: '#EF4444', bg: '#FEE2E2' },
};

function StepRow({ step, isLast }) {
  const cfg = STEP_ICON[step.type] || STEP_ICON.bus;
  const Icon = cfg.icon;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cfg.bg }}>
          <Icon size={16} style={{ color: cfg.color }} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 my-1" style={{ backgroundColor: '#E5E7EB' }} />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {step.route_number && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: cfg.color }}>
              {step.route_number}
            </span>
          )}
          {step.duration_minutes ? (
            <span className="text-[11px] text-gray-400 font-semibold">~{step.duration_minutes} min</span>
          ) : null}
        </div>
        <p className="text-sm text-gray-700 mt-1 leading-snug">{step.instruction}</p>
        {(step.from_stop || step.to_stop) && (
          <p className="text-xs text-gray-400 mt-0.5">
            {step.from_stop} {step.to_stop && <>→ <strong className="text-gray-500">{step.to_stop}</strong></>}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TripPlanner() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  const handlePlan = async () => {
    if (!destination.trim()) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await base44.functions.invoke('planTrip', { origin: origin.trim(), destination: destination.trim() });
      if (res.data?.success) setPlan(res.data.plan);
      else setError('No se pudo generar la ruta. Intenta de nuevo.');
    } catch {
      setError('Error al planificar el viaje.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="bg-white rounded-3xl p-5 space-y-3" style={{ boxShadow: '0 2px 16px rgba(45,106,79,0.08)' }}>
        <div className="relative">
          <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Origen (opcional, usa tu ubicación)"
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none"
            style={{ backgroundColor: '#FFFBF0', color: '#2D6A4F', border: '1.5px solid #D1FAE5' }}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: '#EF4444' }} />
          <input
            type="text"
            placeholder="¿A dónde vas? 🗺️"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePlan()}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none"
            style={{ backgroundColor: '#FFFBF0', color: '#2D6A4F', border: '1.5px solid #D1FAE5' }}
          />
        </div>
        <button
          onClick={handlePlan}
          disabled={!destination.trim() || loading}
          className="w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all"
          style={{ background: destination.trim() && !loading ? 'linear-gradient(135deg,#2D6A4F,#52B788)' : '#E5E7EB' }}
        >
          {loading ? '🦜 Planificando ruta...' : <>Planear viaje <ArrowRight size={16} /></>}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl text-sm font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {plan && (
        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 16px rgba(45,106,79,0.08)' }}>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">{plan.summary}</p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: <Clock size={14} />, label: 'Tiempo', value: plan.total_time_minutes ? `${plan.total_time_minutes} min` : '—' },
              { icon: <DollarSign size={14} />, label: 'Costo', value: plan.total_fare_mxn ? `$${plan.total_fare_mxn}` : '—' },
              { icon: <Repeat size={14} />, label: 'Transbordos', value: plan.transfers ?? 0 },
            ].map(s => (
              <div key={s.label} className="text-center p-2.5 rounded-2xl bg-gray-50">
                <div className="flex justify-center mb-0.5 text-gray-400">{s.icon}</div>
                <p className="font-black text-sm" style={{ color: '#2D6A4F' }}>{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            {(plan.steps || []).map((step, i) => (
              <StepRow key={i} step={step} isLast={i === plan.steps.length - 1} />
            ))}
          </div>

          {plan.tips?.length > 0 && (
            <div className="mt-2 p-3 rounded-2xl" style={{ backgroundColor: '#FFF9E6', border: '1px dashed #FFD60A' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={13} style={{ color: '#92400E' }} />
                <span className="text-xs font-black" style={{ color: '#92400E' }}>CONSEJOS</span>
              </div>
              <ul className="space-y-1">
                {plan.tips.map((t, i) => (
                  <li key={i} className="text-xs" style={{ color: '#78350F' }}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}