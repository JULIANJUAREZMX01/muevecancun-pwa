import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import { Navigation, RefreshCw } from 'lucide-react';
import PredictivePanel from '@/components/map/PredictivePanel';
import TripTracker from '@/components/map/TripTracker';
import { createBusSVGHtml, createUserSVGHtml, createStopSVGHtml } from '@/components/map/BusSVGIcon';
import { useQuery } from '@tanstack/react-query';

// Fix Leaflet default icon path issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Dynamic Leaflet icon factories using SVG
const makeBusIcon = (color, routeNumber, heading = 0, isTracked = false) => L.divIcon({
  html: createBusSVGHtml(color, routeNumber, heading, isTracked),
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
});

const makeUserIcon = () => L.divIcon({
  html: createUserSVGHtml(),
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

const makeStopIcon = (color, isDestination = false) => L.divIcon({
  html: createStopSVGHtml(color, isDestination),
  className: '',
  iconSize: isDestination ? [28, 36] : [16, 16],
  iconAnchor: isDestination ? [14, 36] : [8, 8],
  popupAnchor: [0, -12],
});

const OCCUPANCY_LABEL = {
  empty: '🟢 Vacío', low: '🟢 Poco lleno', medium: '🟡 Moderado', high: '🔴 Lleno', full: '🔴 Completo',
};
const OCCUPANCY_COLOR = {
  empty: '#10B981', low: '#10B981', medium: '#F59E0B', high: '#EF4444', full: '#DC2626',
};

// Sample data — used if DB has no records
const SAMPLE_ROUTES = [
  {
    id: 'r1', number: 'R1', name: 'Centro ↔ Zona Hotelera', color: '#F4A261',
    waypoints: [[21.1619,-86.8515],[21.156,-86.838],[21.145,-86.82],[21.13,-86.795],[21.12,-86.78],[21.105,-86.76]],
  },
  {
    id: 'r2', number: 'R2', name: 'Aeropuerto ↔ Centro', color: '#48CAE4',
    waypoints: [[21.0365,-86.877],[21.06,-86.86],[21.09,-86.855],[21.12,-86.85],[21.1619,-86.8515]],
  },
  {
    id: 'r13', number: 'R13', name: 'SM 64 ↔ Zona Hotelera Sur', color: '#FFD60A',
    waypoints: [[21.18,-86.84],[21.17,-86.83],[21.155,-86.81],[21.13,-86.79]],
  },
  {
    id: 'exp', number: 'EXP', name: 'Express Centro ↔ ZH', color: '#2D6A4F',
    waypoints: [[21.1619,-86.8515],[21.145,-86.82],[21.12,-86.78]],
  },
];

const SAMPLE_STOPS = [
  { id: 's1', name: 'Terminal Centro', lat: 21.1619, lng: -86.8515, route_number: 'R1', next_arrival_minutes: 5 },
  { id: 's2', name: 'Plaza Las Américas', lat: 21.1450, lng: -86.8200, route_number: 'R1', next_arrival_minutes: 12 },
  { id: 's3', name: 'Km 12 Zona Hotelera', lat: 21.1200, lng: -86.7800, route_number: 'R1', next_arrival_minutes: 8 },
  { id: 's4', name: 'El Rey (Km 18)', lat: 21.1050, lng: -86.7600, route_number: 'R1', next_arrival_minutes: 20 },
  { id: 's5', name: 'Aeropuerto Internacional', lat: 21.0365, lng: -86.8770, route_number: 'R2', next_arrival_minutes: 15 },
  { id: 's6', name: 'SM 64 Norte', lat: 21.1800, lng: -86.8400, route_number: 'R13', next_arrival_minutes: 3 },
];

const SAMPLE_BUSES = [
  { id: 'bus1', bus_id: 'R1-001', route_number: 'R1', lat: 21.1450, lng: -86.8200, occupancy: 'medium', next_stop: 'Km 12', speed_kmh: 35, heading: 135, color: '#F4A261' },
  { id: 'bus2', bus_id: 'R1-002', route_number: 'R1', lat: 21.1200, lng: -86.7850, occupancy: 'high', next_stop: 'El Rey', speed_kmh: 28, heading: 150, color: '#F4A261' },
  { id: 'bus3', bus_id: 'R2-001', route_number: 'R2', lat: 21.0600, lng: -86.8600, occupancy: 'low', next_stop: 'Centro', speed_kmh: 45, heading: 0, color: '#48CAE4' },
  { id: 'bus4', bus_id: 'EXP-001', route_number: 'EXP', lat: 21.1350, lng: -86.8050, occupancy: 'medium', next_stop: 'Km 12 ZH', speed_kmh: 55, heading: 120, color: '#2D6A4F' },
];

// Component that follows user position on the map
function MapFollower({ pos, follow }) {
  const map = useMap();
  useEffect(() => {
    if (follow && pos) map.setView(pos, Math.max(map.getZoom(), 15), { animate: true });
  }, [pos, follow]);
  return null;
}

export default function MapPage() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [followUser, setFollowUser] = useState(false);
  const [liveSimBuses, setLiveSimBuses] = useState(SAMPLE_BUSES);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripDestStop, setTripDestStop] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const watchRef = useRef(null);
  const simRef = useRef(null);

  const { data: dbRoutes = [] } = useQuery({
    queryKey: ['map-routes'],
    queryFn: () => base44.entities.Route.list(),
    staleTime: 60000,
  });
  const { data: dbStops = [] } = useQuery({
    queryKey: ['map-stops'],
    queryFn: () => base44.entities.Stop.list(),
    staleTime: 60000,
  });
  const { data: dbBuses = [], refetch: refetchBuses } = useQuery({
    queryKey: ['bus-positions'],
    queryFn: () => base44.entities.BusPosition.filter({ is_active: true }),
    refetchInterval: 20000,
  });

  const displayRoutes = dbRoutes.length > 0 ? dbRoutes : SAMPLE_ROUTES;
  const displayStops = dbStops.length > 0 ? dbStops : SAMPLE_STOPS;
  const displayBuses = dbBuses.length > 0 ? dbBuses : liveSimBuses;

  // Simulate realistic bus movement along route waypoints
  useEffect(() => {
    simRef.current = setInterval(() => {
      setLiveSimBuses(prev => prev.map(bus => {
        const route = SAMPLE_ROUTES.find(r => r.number === bus.route_number);
        if (!route?.waypoints) return bus;
        const wps = route.waypoints;
        const idx = Math.floor(Math.random() * (wps.length - 1));
        const wp = wps[idx];
        const nextWp = wps[idx + 1] || wps[idx];
        // Interpolate a realistic position between two waypoints
        const t = Math.random();
        const newLat = wp[0] + (nextWp[0] - wp[0]) * t + (Math.random() - 0.5) * 0.0005;
        const newLng = wp[1] + (nextWp[1] - wp[1]) * t + (Math.random() - 0.5) * 0.0005;
        // Calculate heading from movement direction
        const dLat = nextWp[0] - wp[0];
        const dLng = nextWp[1] - wp[1];
        const heading = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
        return { ...bus, lat: newLat, lng: newLng, heading, speed_kmh: 20 + Math.floor(Math.random() * 40) };
      }));
      setLastUpdate(new Date());
    }, 15000);
    return () => clearInterval(simRef.current);
  }, []);

  // Continuous GPS tracking of the user
  const startUserTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setFollowUser(true);
      },
      () => {
        // Fallback to Cancún center if GPS denied
        setUserPos([21.1619, -86.8515]);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    // Single initial fix on load
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPos([21.1619, -86.8515]),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return () => { if (watchRef.current) navigator.geolocation?.clearWatch(watchRef.current); };
  }, []);

  const handleTripStart = (trip) => {
    setActiveTrip(trip);
    setSelectedRoute(displayRoutes.find(r => r.number === trip.route.number) || null);
    setFollowUser(true);
    startUserTracking();
    // Set destination stop marker
    const destStop = trip.stops[trip.stops.length - 1];
    setTripDestStop(destStop);
  };

  const handleTripEnd = (summary) => {
    setActiveTrip(null);
    setTripDestStop(null);
    setFollowUser(false);
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  };

  const activeRoutes = selectedRoute
    ? displayRoutes.filter(r => r.number === selectedRoute.number || r.id === selectedRoute.id)
    : displayRoutes;

  // Filter stops to active route when one is selected
  const visibleStops = selectedRoute
    ? displayStops.filter(s => s.route_number === selectedRoute.number)
    : displayStops;

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#FFFBF0', height: '100vh' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-12 pb-3" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-white font-black text-lg">🗺️ Mapa en Vivo</h1>
            <div className="flex items-center gap-2">
              <p className="text-green-100 text-xs">
                {lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {gpsAccuracy && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  📡 ±{gpsAccuracy}m
                </span>
              )}
              {activeTrip && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold animate-pulse" style={{ backgroundColor: '#FFD60A', color: '#2D6A4F' }}>
                  EN VIAJE
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setFollowUser(v => !v); if (!followUser) startUserTracking(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                backgroundColor: followUser ? '#FFD60A' : 'rgba(255,255,255,0.2)',
                color: followUser ? '#2D6A4F' : 'white',
              }}
            >
              <Navigation size={14} />
              {followUser ? 'Siguiendo' : 'Ubicación'}
            </button>
            <button
              onClick={() => refetchBuses()}
              className="p-2 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <RefreshCw size={14} className="text-white" />
            </button>
          </div>
        </div>

        {/* Route filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedRoute(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: !selectedRoute ? '#FFD60A' : 'rgba(255,255,255,0.2)',
              color: !selectedRoute ? '#2D6A4F' : 'white',
            }}
          >
            Todas
          </button>
          {displayRoutes.map(route => (
            <button
              key={route.id || route.number}
              onClick={() => setSelectedRoute(selectedRoute?.number === route.number ? null : route)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: selectedRoute?.number === route.number ? (route.color || '#2D6A4F') : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: selectedRoute?.number === route.number ? `2px solid white` : '2px solid transparent',
              }}
            >
              {route.number}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <MapContainer
          center={userPos || [21.1200, -86.8000]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          <MapFollower pos={userPos} follow={followUser} />

          {/* Route polylines — active trip route drawn thicker */}
          {activeRoutes.map(route => route.waypoints && (
            <Polyline
              key={route.id || route.number}
              positions={route.waypoints}
              color={route.color || '#2D6A4F'}
              weight={activeTrip?.route?.number === route.number ? 7 : 4}
              opacity={activeTrip && activeTrip.route.number !== route.number ? 0.3 : 0.85}
            />
          ))}

          {/* Stop markers */}
          {visibleStops.map(stop => {
            const routeColor = displayRoutes.find(r => r.number === stop.route_number)?.color || '#F4A261';
            const isDestStop = tripDestStop && stop.name === tripDestStop.name;
            return (
              <Marker
                key={stop.id}
                position={[stop.lat, stop.lng]}
                icon={makeStopIcon(routeColor, isDestStop)}
              >
                <Popup>
                  <div className="p-1 min-w-[140px]">
                    <p className="font-bold text-sm text-green-800">{stop.name}</p>
                    <p className="text-xs text-gray-500">Ruta {stop.route_number}</p>
                    {stop.next_arrival_minutes !== undefined && (
                      <p className="text-xs font-bold text-orange-500 mt-1">
                        🚌 Próximo en {stop.next_arrival_minutes} min
                      </p>
                    )}
                    {isDestStop && (
                      <p className="text-xs font-bold mt-1" style={{ color: '#EF4444' }}>🏁 Tu destino</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Bus markers with SVG icon, color, route number and heading */}
          {displayBuses.map(bus => {
            const isTrackedBus = activeTrip?.route?.number === bus.route_number;
            const busColor = bus.color || displayRoutes.find(r => r.number === bus.route_number)?.color || '#2D6A4F';
            return (
              <Marker
                key={bus.id || bus.bus_id}
                position={[bus.lat, bus.lng]}
                icon={makeBusIcon(busColor, bus.route_number || bus.bus_id?.split('-')[0], bus.heading || 0, isTrackedBus)}
              >
                <Popup>
                  <div className="p-1 min-w-[160px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs"
                        style={{ backgroundColor: busColor }}>
                        {bus.route_number || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-green-800">Unidad {bus.bus_id}</p>
                        <p className="text-xs text-gray-500">{bus.speed_kmh || '—'} km/h</p>
                      </div>
                    </div>
                    <div className="space-y-1 mt-1">
                      <p className="text-xs">➡️ <strong>{bus.next_stop}</strong></p>
                      {bus.minutes_to_next_stop && (
                        <p className="text-xs text-gray-500">~{bus.minutes_to_next_stop} min</p>
                      )}
                      <p className="text-xs font-bold" style={{ color: OCCUPANCY_COLOR[bus.occupancy] || '#F59E0B' }}>
                        {OCCUPANCY_LABEL[bus.occupancy] || '🟡 Moderado'}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* User position marker + accuracy circle */}
          {userPos && (
            <>
              <Marker position={userPos} icon={makeUserIcon()}>
                <Popup>
                  <div className="p-1">
                    <p className="text-sm font-bold text-green-800">📍 Tu ubicación</p>
                    {gpsAccuracy && <p className="text-xs text-gray-400">Precisión: ±{gpsAccuracy}m</p>}
                  </div>
                </Popup>
              </Marker>
              {gpsAccuracy && (
                <Circle
                  center={userPos}
                  radius={gpsAccuracy}
                  color="#2D6A4F"
                  fillColor="#2D6A4F"
                  fillOpacity={0.08}
                  weight={1}
                />
              )}
            </>
          )}
        </MapContainer>

        {/* Live bus count badge */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full z-[999]"
          style={{ backgroundColor: '#2D6A4F', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          <div className="live-dot w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="text-white text-xs font-bold">{displayBuses.length} buses</span>
        </div>

        {/* Predictive AI panel */}
        <PredictivePanel selectedRoute={selectedRoute} />

        {/* Trip tracker — FAB + HUD + questions */}
        <TripTracker
          routes={displayRoutes}
          stops={displayStops}
          userPos={userPos}
          onTripStart={handleTripStart}
          onTripEnd={handleTripEnd}
        />
      </div>

      {/* Legend footer */}
      <div
        className="flex-shrink-0 px-4 py-2.5 flex items-center gap-4 overflow-x-auto"
        style={{ backgroundColor: 'white', borderTop: '1px solid #F3F4F6', paddingBottom: 'calc(0.625rem + 5rem)' }}
      >
        <span className="text-xs font-black text-gray-400 flex-shrink-0">LEYENDA</span>
        {[
          { label: 'Autobús', el: <svg viewBox="0 0 38 22" width="28" height="16"><rect x="1" y="1" width="36" height="16" rx="4" fill="#F4A261"/><rect x="4" y="3" width="12" height="8" rx="1" fill="rgba(255,255,255,0.8)"/><rect x="18" y="3" width="12" height="8" rx="1" fill="rgba(255,255,255,0.8)"/><circle cx="8" cy="19" r="3" fill="#333"/><circle cx="28" cy="19" r="3" fill="#333"/></svg> },
          { label: 'Parada', el: <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="7" fill="white" stroke="#F4A261" strokeWidth="2.5"/><circle cx="8" cy="8" r="3" fill="#F4A261"/></svg> },
          { label: 'Tú', el: <svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="10" fill="#2D6A4F" stroke="white" strokeWidth="3"/><circle cx="12" cy="12" r="4" fill="#FFD60A"/></svg> },
          { label: 'Destino', el: <span className="text-sm">🏁</span> },
        ].map(({ label, el }) => (
          <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
            {el}
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}