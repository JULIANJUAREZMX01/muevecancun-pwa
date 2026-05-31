import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Brain, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Clock, Bus, MapPin, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PRIORITY_COLORS = {
  ALTA: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  MEDIA: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  BAJA: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
};

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '20' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color: '#1F2937' }}>{value}</p>
        <p className="text-xs text-gray-500 font-semibold">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  const { data: routes = [] } = useQuery({
    queryKey: ['dashboard-routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['dashboard-buses'],
    queryFn: () => base44.entities.BusPosition.filter({ is_active: true }),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_active: true }),
  });

  const activeRoutes = routes.filter(r => r.status === 'active' || !r.status).length;
  const delayedRoutes = routes.filter(r => r.status === 'delayed').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('analyzeRoutes', {});
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        setAnalysis(res.data);
        setLastRun(new Date());
      }
    } catch (err) {
      setError(err.message || 'Error al ejecutar el análisis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-4 pt-12 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain size={20} className="text-yellow-300" />
                <h1 className="text-white font-black text-xl">Dashboard IA</h1>
              </div>
              <p className="text-green-100 text-sm">Optimización de rutas con Hugging Face</p>
            </div>
            {lastRun && (
              <div className="text-right">
                <p className="text-green-100 text-xs">Último análisis</p>
                <p className="text-white text-xs font-bold">
                  {lastRun.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Bus size={20} />} label="Rutas Activas" value={activeRoutes || routes.length || '—'} color="#2D6A4F" />
          <StatCard icon={<Zap size={20} />} label="Buses en Línea" value={buses.length || '—'} color="#52B788" />
          <StatCard icon={<AlertTriangle size={20} />} label="Alertas Altas" value={highAlerts} color="#EF4444" />
          <StatCard icon={<Clock size={20} />} label="Rutas Demoradas" value={delayedRoutes} color="#F59E0B" />
        </div>

        {/* Analyze Button */}
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all"
          style={{
            background: isAnalyzing
              ? '#E5E7EB'
              : 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)',
            color: isAnalyzing ? '#9CA3AF' : 'white',
            boxShadow: isAnalyzing ? 'none' : '0 4px 20px rgba(45,106,79,0.35)',
          }}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Analizando con Hugging Face...
            </>
          ) : (
            <>
              <Brain size={20} />
              Analizar y Optimizar Rutas
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} style={{ color: '#EF4444' }} />
              <p className="font-bold text-sm text-red-700">Error en el análisis</p>
            </div>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Analysis Result */}
        {analysis && !isAnalyzing && (
          <div className="space-y-4">
            {/* Metadata bar */}
            <div
              className="flex items-center gap-4 p-3 rounded-2xl overflow-x-auto"
              style={{ backgroundColor: '#D1FAE5', border: '1px solid #BBF7D0' }}
            >
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <CheckCircle size={14} style={{ color: '#2D6A4F' }} />
                <span className="text-xs font-bold text-green-800">Análisis completado</span>
              </div>
              <span className="text-xs text-green-700 flex-shrink-0">
                🚌 {analysis.metadata?.routes_analyzed} rutas
              </span>
              <span className="text-xs text-green-700 flex-shrink-0">
                📍 {analysis.metadata?.buses_tracked} buses
              </span>
              <span className="text-xs text-green-700 flex-shrink-0">
                ⚠️ {analysis.metadata?.active_alerts} alertas
              </span>
            </div>

            {/* AI Analysis Card */}
            <div
              className="bg-white rounded-3xl p-5"
              style={{ boxShadow: '0 2px 16px rgba(45,106,79,0.1)' }}
            >
              <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)' }}
                >
                  <Brain size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-sm" style={{ color: '#1F2937' }}>Análisis de Optimización</p>
                  <p className="text-xs text-gray-500">Generado por Mistral-7B vía Hugging Face</p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-sm text-gray-700 mb-3 leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="font-black" style={{ color: '#2D6A4F' }}>{children}</strong>,
                    ul: ({ children }) => <ul className="ml-4 space-y-1 mb-3 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="ml-4 space-y-1 mb-3 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,
                    h1: ({ children }) => (
                      <h1 className="font-black text-base mb-2 mt-4 pb-1" style={{ color: '#2D6A4F', borderBottom: '2px solid #D1FAE5' }}>{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="font-black text-sm mb-2 mt-3" style={{ color: '#2D6A4F' }}>{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-bold text-sm mb-1 mt-2 text-gray-800">{children}</h3>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 pl-3 py-1 my-2 text-sm text-gray-600 italic" style={{ borderColor: '#52B788', backgroundColor: '#F0FDF4', borderRadius: '0 8px 8px 0' }}>
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {analysis.analysis}
                </ReactMarkdown>
              </div>
            </div>

            {/* Re-run */}
            <button
              onClick={runAnalysis}
              className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: 'white', color: '#2D6A4F', border: '2px solid #D1FAE5' }}
            >
              <RefreshCw size={14} />
              Volver a analizar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!analysis && !isAnalyzing && !error && (
          <div
            className="text-center py-10 rounded-3xl"
            style={{ backgroundColor: 'white', border: '2px dashed #D1FAE5' }}
          >
            <span className="text-5xl block mb-3">🤖</span>
            <p className="font-black text-base" style={{ color: '#2D6A4F' }}>IA lista para analizar</p>
            <p className="text-sm text-gray-500 mt-1 px-6">
              Presiona el botón para obtener recomendaciones de optimización basadas en datos reales
            </p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}