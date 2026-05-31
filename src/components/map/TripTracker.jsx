import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, X, ChevronRight, MapPin, AlertCircle, CheckCircle, RefreshCw, ArrowUpDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Crowdsource questions asked at key moments during the trip
const TRIP_QUESTIONS = {
  boarding: [
    { id: 'caught_bus', text: '¿Alcanzaste el bus?', options: ['✅ Sí, subí', '❌ No, se fue', '⏳ Esperando'] },
    { id: 'bus_full', text: '¿Cómo está el bus?', options: ['🟢 Vacío', '🟡 Moderado', '🔴 Lleno'] },
  ],
  onboard: [
    { id: 'onboard_confirm', text: '¿Ya estás a bordo?', options: ['✅ Sí, en el bus', '🚶 Caminando aún'] },
    { id: 'comfort', text: '¿Pudiste sentarte?', options: ['✅ Sí', '❌ No, de pie'] },
  ],
  transfer: [
    { id: 'transfer_ok', text: '¿Listo para transbordar?', options: ['✅ Sí', '❓ ¿Dónde bajo?', '⏳ Esperando'] },
  ],
  arrival: [
    { id: 'arrived', text: '¿Llegaste a tu destino?', options: ['✅ ¡Llegué!', '🚶 A unos pasos', '❌ Ruta equivocada'] },
  ],
  rating: [
    { id: 'trip_rating', text: '¿Cómo calificarías el viaje?', options: ['⭐⭐⭐⭐⭐ Excelente', '⭐⭐⭐ Regular', '⭐ Malo'] },
  ],
};

// Points of interest near Cancún routes
const POIS = [
  { lat: 21.1619, lng: -86.8515, name: 'Terminal ADO Centro', icon: '🚌', type: 'terminal' },
  { lat: 21.1450, lng: -86.8200, name: 'Plaza Las Américas', icon: '🛍️', type: 'mall' },
  { lat: 21.1200, lng: -86.7800, name: 'Km 12 - Hotel Zone', icon: '🏨', type: 'hotel' },
  { lat: 21.1050, lng: -86.7600, name: 'El Rey Ruins', icon: '🏛️', type: 'tourist' },
  { lat: 21.0365, lng: -86.8770, name: 'Aeropuerto CUN', icon: '✈️', type: 'airport' },
  { lat: 21.1619, lng: -86.8500, name: 'Mercado 23', icon: '🛒', type: 'market' },
  { lat: 21.1580, lng: -86.8460, name: 'Parque Las Palapas', icon: '🌳', type: 'park' },
];

function dist(a, b) {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function QuestionCard({ question, onAnswer, onDismiss }) {
  return (
    <div className="absolute bottom-24 left-3 right-3 z-[1001] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-3xl p-4 shadow-2xl border-2 border-yellow-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: '#FFF9E6' }}>🦜</div>
            <p className="font-black text-sm" style={{ color: '#2D6A4F' }}>{question.text}</p>
          </div>
          <button onClick={onDismiss} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(question.id, opt)}
              className="w-full text-left px-3 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: '#F0FDF4', color: '#2D6A4F', border: '1.5px solid #BBF7D0' }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TripHUD({ trip, userPos, onEndTrip, onShowQuestion }) {
  const elapsed = Math.floor((Date.now() - trip.startTime) / 60000);
  const nextStop = trip.stops[trip.currentStopIdx];
  const transfer = trip.transfers?.[0];

  return (
    <div className="absolute bottom-24 left-3 right-3 z-[1000]">
      {/* Main HUD */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ border: `3px solid ${trip.route.color}` }}>
        {/* Header bar */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: trip.route.color }}>
          <div className="flex items-center gap-2">
            <div className="live-dot w-2.5 h-2.5 rounded-full bg-white"></div>
            <span className="text-white font-black text-sm">EN VIAJE · {trip.route.number}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-bold opacity-80">{elapsed} min</span>
            <button
              onClick={onEndTrip}
              className="px-3 py-1 rounded-xl text-xs font-black"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}
            >
              Terminar
            </button>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2.5">
          {/* Next stop */}
          {nextStop && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D1FAE5' }}>
                <MapPin size={16} style={{ color: '#2D6A4F' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Próxima parada</p>
                <p className="font-black text-sm truncate" style={{ color: '#1F2937' }}>{nextStop.name}</p>
              </div>
              <span className="font-black text-sm flex-shrink-0" style={{ color: trip.route.color }}>
                {nextStop.eta} min
              </span>
            </div>
          )}

          {/* Transfer alert */}
          {transfer && (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl" style={{ backgroundColor: '#FEF3C7' }}>
              <ArrowUpDown size={16} style={{ color: '#92400E', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black" style={{ color: '#92400E' }}>TRANSBORDO EN {transfer.atStop}</p>
                <p className="text-xs text-amber-700">→ Toma la ruta <strong>{transfer.toRoute}</strong></p>
              </div>
            </div>
          )}

          {/* Destination */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
              <span className="text-lg">🏁</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Destino</p>
              <p className="font-black text-sm truncate" style={{ color: '#1F2937' }}>{trip.destination}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-bold flex-shrink-0" style={{ backgroundColor: '#D1FAE5', color: '#2D6A4F' }}>
              ~{trip.totalEta} min
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${trip.progress}%`, backgroundColor: trip.route.color }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">{trip.route.origin || 'Origen'}</span>
              <span className="text-[10px] font-bold" style={{ color: trip.route.color }}>{Math.round(trip.progress)}%</span>
              <span className="text-[10px] text-gray-400">{trip.destination}</span>
            </div>
          </div>

          {/* Crowdsource button */}
          <button
            onClick={onShowQuestion}
            className="w-full py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FFF9E6', color: '#92400E', border: '1px dashed #F59E0B' }}
          >
            🦜 Reportar situación del bus
          </button>
        </div>
      </div>
    </div>
  );
}

function NearbyPOI({ poi, onDismiss }) {
  return (
    <div className="absolute top-20 left-3 right-3 z-[1001]">
      <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg" style={{ border: '1.5px solid #D1FAE5' }}>
        <span className="text-2xl flex-shrink-0">{poi.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-gray-400 uppercase">Punto de interés cercano</p>
          <p className="font-bold text-sm truncate" style={{ color: '#1F2937' }}>{poi.name}</p>
        </div>
        <button onClick={onDismiss} className="text-gray-300 flex-shrink-0"><X size={14} /></button>
      </div>
    </div>
  );
}

export default function TripTracker({ routes, stops, userPos, onTripStart, onTripEnd }) {
  const [showPlanner, setShowPlanner] = useState(false);
  const [trip, setTrip] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [nearbyPOI, setNearbyPOI] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [destination, setDestination] = useState('');
  const [selectedRoute, setSelectedRouteLocal] = useState(null);
  const watchRef = useRef(null);
  const questionTimerRef = useRef(null);

  const ROUTE_OPTIONS = [
    { number: 'R1', name: 'Centro ↔ Zona Hotelera', color: '#F4A261', origin: 'Terminal Centro', stops: [
      { name: 'Terminal Centro', lat: 21.1619, lng: -86.8515, eta: 0 },
      { name: 'Plaza Las Américas', lat: 21.1450, lng: -86.8200, eta: 8 },
      { name: 'Km 9 Kukulcán', lat: 21.1350, lng: -86.8050, eta: 15 },
      { name: 'Km 12 Zona Hotelera', lat: 21.1200, lng: -86.7800, eta: 22 },
      { name: 'El Rey (Km 18)', lat: 21.1050, lng: -86.7600, eta: 35 },
    ]},
    { number: 'R2', name: 'Aeropuerto ↔ Centro', color: '#48CAE4', origin: 'Aeropuerto CUN', stops: [
      { name: 'Aeropuerto Internacional', lat: 21.0365, lng: -86.8770, eta: 0 },
      { name: 'Huayacán', lat: 21.0600, lng: -86.8600, eta: 10 },
      { name: 'SM 12', lat: 21.0900, lng: -86.8550, eta: 20 },
      { name: 'Terminal Centro', lat: 21.1619, lng: -86.8515, eta: 40 },
    ]},
    { number: 'R13', name: 'SM 64 ↔ Zona Hotelera Sur', color: '#FFD60A', origin: 'SM 64', stops: [
      { name: 'SM 64 Norte', lat: 21.1800, lng: -86.8400, eta: 0 },
      { name: 'SM 45', lat: 21.1700, lng: -86.8300, eta: 8 },
      { name: 'Km 5 Kukulcán', lat: 21.1550, lng: -86.8100, eta: 18 },
      { name: 'Km 18 Zona Hotelera Sur', lat: 21.1300, lng: -86.7900, eta: 30 },
    ]},
    { number: 'EXP', name: 'Express Centro ↔ ZH', color: '#2D6A4F', origin: 'Centro', stops: [
      { name: 'Terminal Centro', lat: 21.1619, lng: -86.8515, eta: 0 },
      { name: 'Plaza Américas', lat: 21.1450, lng: -86.8200, eta: 6 },
      { name: 'Km 12 ZH', lat: 21.1200, lng: -86.7800, eta: 18 },
    ]},
  ];

  // Watch user GPS position during trip
  const startGPSTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        // Update trip progress based on position along route
        setTrip(prev => {
          if (!prev) return prev;
          const stops = prev.stops;
          let closestIdx = 0;
          let minD = Infinity;
          stops.forEach((s, i) => {
            const d = dist(newPos, [s.lat, s.lng]);
            if (d < minD) { minD = d; closestIdx = i; }
          });
          const progress = Math.min(100, (closestIdx / (stops.length - 1)) * 100);

          // Trigger transfer question near transfer stop
          if (prev.transfers?.length > 0 && closestIdx >= stops.length - 2 && !prev.transferNotified) {
            setQuestionQueue(q => [...q, ...TRIP_QUESTIONS.transfer]);
            return { ...prev, currentStopIdx: closestIdx, progress, transferNotified: true };
          }

          // Trigger arrival question when near last stop
          if (closestIdx === stops.length - 1 && minD < 300 && !prev.arrivalNotified) {
            setQuestionQueue(q => [...q, ...TRIP_QUESTIONS.arrival]);
            return { ...prev, currentStopIdx: closestIdx, progress, arrivalNotified: true };
          }

          return { ...prev, currentStopIdx: closestIdx, progress };
        });

        // Check nearby POIs
        const nearby = POIS.find(p => dist(newPos, [p.lat, p.lng]) < 200);
        if (nearby) setNearbyPOI(nearby);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }, []);

  // Show queued questions with a delay
  useEffect(() => {
    if (questionQueue.length > 0 && !activeQuestion) {
      const next = questionQueue[0];
      setActiveQuestion(next);
      setQuestionQueue(prev => prev.slice(1));
    }
  }, [questionQueue, activeQuestion]);

  // Ask onboard question 2 min after boarding
  useEffect(() => {
    if (!trip) return;
    questionTimerRef.current = setTimeout(() => {
      setQuestionQueue(q => [...q, ...TRIP_QUESTIONS.onboard]);
    }, 120000);
    return () => clearTimeout(questionTimerRef.current);
  }, [trip?.startTime]);

  const handleStartTrip = () => {
    if (!selectedRoute || !destination) return;
    const route = ROUTE_OPTIONS.find(r => r.number === selectedRoute);
    if (!route) return;

    const newTrip = {
      route,
      destination,
      stops: route.stops,
      currentStopIdx: 0,
      progress: 0,
      startTime: Date.now(),
      totalEta: route.stops[route.stops.length - 1]?.eta || 30,
      transfers: destination === 'Zona Hotelera' && route.number === 'R2'
        ? [{ atStop: 'Terminal Centro', toRoute: 'R1' }]
        : [],
    };

    setTrip(newTrip);
    setShowPlanner(false);
    setQuestionQueue(TRIP_QUESTIONS.boarding);
    startGPSTracking();
    onTripStart?.(newTrip);

    // Report boarding to award points
    base44.functions.invoke('addPoints', { action: 'trip' }).catch(() => {});
  };

  const handleAnswer = (questionId, answer) => {
    const newAnswer = { questionId, answer, timestamp: new Date().toISOString(), route: trip?.route?.number };
    setAnswers(prev => [...prev, newAnswer]);
    setActiveQuestion(null);

    // Handle specific answers
    if (questionId === 'arrived' && answer.includes('Llegué')) {
      setTimeout(() => setQuestionQueue(q => [...q, ...TRIP_QUESTIONS.rating]), 1000);
    }
    if (questionId === 'trip_rating') {
      handleEndTrip(true);
    }
  };

  const handleEndTrip = (completed = false) => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    clearTimeout(questionTimerRef.current);
    const summary = { ...trip, endTime: Date.now(), completed, answers };

    // Save telemetry to DB asynchronously
    if (trip) {
      const duration = Math.round((Date.now() - trip.startTime) / 60000);
      const caughtAns = answers.find(a => a.questionId === 'caught_bus');
      const occAns = answers.find(a => a.questionId === 'bus_full');
      const ratingAns = answers.find(a => a.questionId === 'trip_rating');
      const occMap = { '🟢 Vacío': 'empty', '🟡 Moderado': 'medium', '🔴 Lleno': 'full' };
      const ratingMap = { '⭐⭐⭐⭐⭐ Excelente': 5, '⭐⭐⭐ Regular': 3, '⭐ Malo': 1 };

      base44.entities.TripTelemetry.create({
        route_number: trip.route.number,
        destination: trip.destination,
        duration_minutes: duration,
        completed,
        crowdsource_answers: answers,
        bus_caught: caughtAns ? caughtAns.answer.includes('Sí') : undefined,
        bus_occupancy_reported: occAns ? (occMap[occAns.answer] || 'medium') : undefined,
        trip_rating: ratingAns ? (ratingMap[ratingAns.answer] || undefined) : undefined,
      }).catch(() => {});
    }

    setTrip(null);
    setActiveQuestion(null);
    setQuestionQueue([]);
    setNearbyPOI(null);
    onTripEnd?.(summary);
  };

  // Trip Planner modal
  if (showPlanner) {
    return (
      <div className="absolute inset-0 z-[1002] flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl px-5 pt-5 pb-8 overflow-y-auto"
          style={{ backgroundColor: 'white', maxHeight: '80vh' }}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <h2 className="font-black text-lg mb-4" style={{ color: '#2D6A4F' }}>🗺️ Planificar Viaje</h2>

          <p className="text-xs font-black text-gray-400 mb-2">SELECCIONA TU RUTA</p>
          <div className="space-y-2 mb-4">
            {ROUTE_OPTIONS.map(r => (
              <button
                key={r.number}
                onClick={() => setSelectedRouteLocal(r.number)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
                style={{
                  backgroundColor: selectedRoute === r.number ? `${r.color}20` : '#F9FAFB',
                  border: `2px solid ${selectedRoute === r.number ? r.color : 'transparent'}`,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs flex-shrink-0"
                  style={{ backgroundColor: r.color }}>{r.number}</div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#1F2937' }}>{r.name}</p>
                  <p className="text-xs text-gray-400">{r.stops.length} paradas · ~{r.stops[r.stops.length - 1]?.eta} min</p>
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs font-black text-gray-400 mb-2">¿A DÓNDE VAS?</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {['Zona Hotelera', 'Centro', 'Aeropuerto', 'Plaza Américas', 'SM 64', 'Puerto Morelos'].map(d => (
              <button
                key={d}
                onClick={() => setDestination(d)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: destination === d ? '#2D6A4F' : '#F3F4F6',
                  color: destination === d ? 'white' : '#6B7280',
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPlanner(false)}
              className="flex-1 py-3 rounded-2xl font-bold text-sm"
              style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleStartTrip}
              disabled={!selectedRoute || !destination}
              className="flex-2 px-6 py-3 rounded-2xl font-black text-sm text-white transition-all"
              style={{
                background: selectedRoute && destination ? 'linear-gradient(135deg, #2D6A4F, #52B788)' : '#E5E7EB',
                flex: 2,
                color: selectedRoute && destination ? 'white' : '#9CA3AF',
              }}
            >
              🚌 Iniciar Seguimiento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Start trip FAB — only show when no active trip */}
      {!trip && (
        <button
          onClick={() => setShowPlanner(true)}
          className="absolute z-[1000] flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95"
          style={{
            bottom: '120px',
            left: '12px',
            background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(45,106,79,0.4)',
          }}
        >
          <Navigation size={16} />
          Seguir viaje
        </button>
      )}

      {/* Active trip HUD */}
      {trip && (
        <TripHUD
          trip={trip}
          userPos={userPos}
          onEndTrip={() => handleEndTrip(false)}
          onShowQuestion={() => {
            const q = TRIP_QUESTIONS.onboard[0];
            setActiveQuestion(q);
          }}
        />
      )}

      {/* Crowdsource question card */}
      {activeQuestion && (
        <QuestionCard
          question={activeQuestion}
          onAnswer={handleAnswer}
          onDismiss={() => setActiveQuestion(null)}
        />
      )}

      {/* Nearby POI toast */}
      {nearbyPOI && (
        <NearbyPOI poi={nearbyPOI} onDismiss={() => setNearbyPOI(null)} />
      )}
    </>
  );
}