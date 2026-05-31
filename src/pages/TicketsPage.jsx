import { useState, useEffect } from 'react';
import { Ticket, Plus, QrCode, Clock, MapPin, Trash2, WifiOff } from 'lucide-react';
import { offlineCache } from '@/lib/offlineCache';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { base44 } from '@/api/base44Client';

const ROUTE_OPTIONS = [
  { number: 'R1', name: 'Centro ↔ Zona Hotelera', color: '#F4A261', fare: 12 },
  { number: 'R2', name: 'Aeropuerto ↔ Centro', color: '#48CAE4', fare: 12 },
  { number: 'R13', name: 'SM 64 ↔ ZH Sur', color: '#FFD60A', fare: 12 },
  { number: 'EXP', name: 'Express Centro ↔ ZH', color: '#2D6A4F', fare: 15 },
  { number: 'R1A', name: 'Plaza Américas ↔ ZH Norte', color: '#52B788', fare: 12 },
  { number: 'R15', name: 'Central ↔ Puerto Morelos', color: '#E76F51', fare: 18 },
];

function generateQR(code) {
  // Simple visual QR placeholder using the code chars
  return code;
}

function TicketCard({ ticket, onDelete }) {
  const [showQR, setShowQR] = useState(false);
  const route = ROUTE_OPTIONS.find(r => r.number === ticket.route_number) || { color: '#2D6A4F', fare: 12 };
  const isExpired = new Date(ticket.expires_at) < new Date();
  const isUsed = ticket.status === 'used';

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden"
      style={{
        boxShadow: '0 2px 16px rgba(45,106,79,0.1)',
        opacity: isExpired || isUsed ? 0.6 : 1,
        border: isExpired || isUsed ? '1px solid #E5E7EB' : `2px solid ${route.color}40`,
      }}
    >
      {/* Ticket header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: `3px dashed ${route.color}40` }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
          style={{ backgroundColor: route.color }}>
          {ticket.route_number}
        </div>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: '#1F2937' }}>{ticket.route_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold" style={{ color: route.color }}>${ticket.fare} MXN</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <Clock size={9} /> {new Date(ticket.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
        <div>
          {isExpired ? (
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>Vencido</span>
          ) : isUsed ? (
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>✅ Usado</span>
          ) : (
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>Válido</span>
          )}
        </div>
      </div>

      {/* Ticket body */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Código</p>
            <p className="font-mono font-black text-sm" style={{ color: '#2D6A4F' }}>{ticket.code}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isExpired && !isUsed && (
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: '#F0FDF4', color: '#2D6A4F', border: '1px solid #BBF7D0' }}
              >
                <QrCode size={12} /> {showQR ? 'Ocultar' : 'Ver QR'}
              </button>
            )}
            <button onClick={() => onDelete(ticket.code)}
              className="p-1.5 rounded-xl"
              style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* QR display */}
        {showQR && (
          <div className="mt-3 p-4 rounded-2xl flex flex-col items-center gap-2"
            style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center p-2"
              style={{ border: '2px solid #2D6A4F' }}>
              <div className="grid grid-cols-5 gap-0.5 w-full h-full">
                {Array.from(ticket.code).map((c, i) => (
                  <div key={i} className="rounded-sm"
                    style={{ backgroundColor: (c.charCodeAt(0) % 3 === 0) ? '#2D6A4F' : (c.charCodeAt(0) % 3 === 1) ? '#52B788' : '#FFFBF0' }} />
                ))}
              </div>
            </div>
            <p className="text-xs font-mono font-bold text-gray-600">{ticket.code}</p>
            <p className="text-[10px] text-gray-400">Válido hasta {new Date(ticket.expires_at).toLocaleDateString('es-MX')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BuyTicketModal({ onClose, onBuy }) {
  const [selectedRoute, setSelectedRoute] = useState(ROUTE_OPTIONS[0]);
  const [qty, setQty] = useState(1);

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl px-5 pt-5 pb-8">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="font-black text-lg mb-4" style={{ color: '#2D6A4F' }}>🎫 Nuevo Boleto Digital</h2>

        <p className="text-xs font-bold text-gray-400 mb-2">SELECCIONA RUTA</p>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {ROUTE_OPTIONS.map(r => (
            <button key={r.number} onClick={() => setSelectedRoute(r)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
              style={{
                backgroundColor: selectedRoute.number === r.number ? `${r.color}20` : '#F9FAFB',
                border: selectedRoute.number === r.number ? `2px solid ${r.color}` : '2px solid transparent',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs"
                style={{ backgroundColor: r.color }}>{r.number}</div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: '#1F2937' }}>{r.name}</p>
                <p className="text-xs" style={{ color: r.color }}>${r.fare} MXN</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl mb-4"
          style={{ backgroundColor: '#F0FDF4' }}>
          <p className="font-bold text-sm" style={{ color: '#2D6A4F' }}>Cantidad</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full font-black text-white flex items-center justify-center"
              style={{ backgroundColor: '#2D6A4F' }}>−</button>
            <span className="font-black text-lg w-6 text-center" style={{ color: '#1F2937' }}>{qty}</span>
            <button onClick={() => setQty(q => Math.min(10, q + 1))}
              className="w-8 h-8 rounded-full font-black text-white flex items-center justify-center"
              style={{ backgroundColor: '#2D6A4F' }}>+</button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5 px-1">
          <span className="font-bold text-gray-600">Total:</span>
          <span className="font-black text-2xl" style={{ color: '#2D6A4F' }}>${selectedRoute.fare * qty} MXN</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
            Cancelar
          </button>
          <button onClick={() => onBuy(selectedRoute, qty)}
            className="flex-2 px-6 py-3.5 rounded-2xl font-black text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', flex: 2 }}>
            🎫 Generar boletos
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [showBuy, setShowBuy] = useState(false);
  const [toast, setToast] = useState(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const cached = offlineCache.getTickets() || [];
    setTickets(cached);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = (route, qty) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const newTickets = Array.from({ length: qty }, (_, i) => ({
      code: `MC${route.number}${Date.now()}${i}`.toUpperCase().slice(0, 12),
      route_number: route.number,
      route_name: route.name,
      fare: route.fare,
      color: route.color,
      status: 'valid',
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    }));

    const all = [...newTickets, ...tickets];
    setTickets(all);
    offlineCache.saveTickets(all);
    setShowBuy(false);
    showToast(`✅ ${qty} boleto${qty > 1 ? 's' : ''} generado${qty > 1 ? 's' : ''} para ruta ${route.number}`);

    // Award points for purchase
    base44.functions.invoke('addPoints', { action: 'trip' }).catch(() => {});
  };

  const handleDelete = (code) => {
    const updated = tickets.filter(t => t.code !== code);
    setTickets(updated);
    offlineCache.saveTickets(updated);
  };

  const validTickets = tickets.filter(t => t.status !== 'used' && new Date(t.expires_at) >= new Date());
  const historyTickets = tickets.filter(t => t.status === 'used' || new Date(t.expires_at) < new Date());

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFBF0' }}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg,#2D6A4F,#52B788)', maxWidth: '320px', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Ticket size={20} className="text-yellow-300" />
              <h1 className="text-white font-black text-xl">Boletos Digitales</h1>
            </div>
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <WifiOff size={12} className="text-yellow-300" />
                <span className="text-yellow-300 text-xs font-bold">Offline</span>
              </div>
            )}
          </div>
          <p className="text-green-100 text-sm">{validTickets.length} boleto{validTickets.length !== 1 ? 's' : ''} válido{validTickets.length !== 1 ? 's' : ''} · guardados en tu dispositivo</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Offline note */}
        {!isOnline && (
          <div className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
            <WifiOff size={16} style={{ color: '#92400E', flexShrink: 0 }} />
            <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
              Modo offline: tus boletos están guardados localmente y son válidos sin conexión.
            </p>
          </div>
        )}

        {/* Buy button */}
        <button onClick={() => setShowBuy(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl font-black text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', boxShadow: '0 4px 20px rgba(45,106,79,0.3)' }}>
          <Plus size={18} /> Nuevo Boleto Digital
        </button>

        {/* Valid tickets */}
        {validTickets.length > 0 && (
          <div>
            <p className="text-xs font-black text-gray-400 mb-2">BOLETOS ACTIVOS ({validTickets.length})</p>
            <div className="space-y-3">
              {validTickets.map(t => (
                <TicketCard key={t.code} ticket={t} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {validTickets.length === 0 && (
          <div className="text-center py-10">
            <span className="text-5xl block mb-3">🎫</span>
            <p className="font-black text-base" style={{ color: '#2D6A4F' }}>Sin boletos activos</p>
            <p className="text-sm text-gray-400 mt-1">Genera tu primer boleto digital</p>
          </div>
        )}

        {/* History */}
        {historyTickets.length > 0 && (
          <div>
            <p className="text-xs font-black text-gray-400 mb-2">HISTORIAL ({historyTickets.length})</p>
            <div className="space-y-3">
              {historyTickets.map(t => (
                <TicketCard key={t.code} ticket={t} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      {showBuy && <BuyTicketModal onClose={() => setShowBuy(false)} onBuy={handleBuy} />}
    </div>
  );
}