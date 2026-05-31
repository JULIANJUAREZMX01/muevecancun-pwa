import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import { Navigation, Layers, RefreshCw } from 'lucide-react';
import PredictivePanel from '@/components/map/PredictivePanel';
import { useQuery } from '@tanstack/react-query';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createBusIcon = (color = '#2D6A4F') => L.divIcon({
  html: `<div style="background:${color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:14px;">🚌</span>
  </div>`,
  className: 'bus-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const createStopIcon = (color = '#F4A261') => L.divIcon({
  html: `<div style="background:white;width:14px;height:14px;border-radius:50%;border:3px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

const userIcon = L.divIcon({
  html: `<div style="background:#2D6A4F;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(45,106,79,0.3);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Sample routes for Cancún
const SAMPLE_ROUTES = [
  {
    id: 'r1', number: 'R1', name: 'Centro ↔ Zona Hotelera', color: '#F4A261',
    waypoints: [
      [21.1619, -86.8515], [21.1560, -86.8380], [21.1450, -86.8200],
      [21.1300, -86.7950], [21.1200, -86.7800], [21.1050, -86.7600],
    ],
  },
  {
    id: 'r2', number: 'R2', name: 'Aeropuerto ↔ Centro', color: '#48CAE4',
    waypoints: [
      [21.0365, -86.8770], [21.0600, -86.8600], [21.0900, -86.8550],
      [21.1200, -86.8500], [21.1619, -86.8515],
    ],
  },
  {
    id: 'r13', number: 'R13', name: 'SM 64 ↔ Zona Hotelera Sur', color: '#FFD60A',
    waypoints: [
      [21.1800, -86.8400], [21.1700, -86.8300], [21.1550, -86.8100],
      [21.1300, -86.7900],
    ],
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
  { id: 'bus1', bus_id: 'R1-001', route_number: 'R1', lat: 21.1450, lng: -86.8200, occupancy: 'medium', next_stop: 'Km 12', color: '#F4A261' },
  { id: 'bus2', bus_id: 'R1-002', route_number: 'R1', lat: 21.1200, lng: -86.7850, occupancy: 'high', next_stop: 'El Rey', color: '#F4A261' },
  { id: 'bus3', bus_id: 'R2-001', route_number: 'R2', lat: 21.0600, lng: -86.8600, occupancy: 'low', next_stop: 'Centro', color: '#48CAE4' },
];

const OCCUPANCY_LABEL = { empty: '🟢 Vacío', low: '🟢 Poco', medium: '🟡 Moderado', high: '🔴 Lleno', full: '🔴 Completo' };

export default function MapPage() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [busPositions, setBusPositions] = useState(SAMPLE_BUSES);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: dbRoutes = [] } = useQuery({
    queryKey: ['map-routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const { data: dbStops = [] } = useQuery({
    queryKey: ['map-stops'],
    queryFn: () => base44.entities.Stop.list(),
  });

  const { data: dbBuses = [] } = useQuery({
    queryKey: ['bus-positions'],
    queryFn: () => base44.entities.BusPosition.filter({ is_active: true }),
    refetchInterval: 30000,
  });

  const displayRoutes = dbRoutes.length > 0 ? dbRoutes : SAMPLE_ROUTES;
  const displayStops = dbStops.length > 0 ? dbStops : SAMPLE_STOPS;
  const displayBuses = dbBuses.length > 0 ? dbBuses : busPositions;

  // Simulate bus movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBusPositions(prev => prev.map(bus => ({
        ...bus,
        lat: bus.lat + (Math.random() - 0.5) * 0.002,
        lng: bus.lng + (Math.random() - 0.5) * 0.002,
      })));
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => setUserPos([21.1619, -86.8515])
      );
    }
  };

  useEffect(() => { getUserLocation(); }, []);

  const activeRoutes = selectedRoute
    ? displayRoutes.filter(r => (r.id || r.number) === (selectedRoute.id || selectedRoute.number))
    : displayRoutes;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#FFFBF0' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-3" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-lg">🗺️ Mapa en Vivo</h1>
            <p className="text-green-100 text-xs">
              Actualizado: {lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={getUserLocation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
            style={{ backgroundColor: '#FFD60A', color: '#2D6A4F' }}
          >
            <Navigation size={14} />
            Mi Ubicación
          </button>
        </div>

        {/* Route filter pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedRoute(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
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
                backgroundColor: selectedRoute?.number === route.number ? route.color : 'rgba(255,255,255,0.2)',
                color: 'white',
              }}
            >
              {route.number}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[21.1200, -86.8000]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />

          {/* Routes */}
          {activeRoutes.map(route => route.waypoints && (
            <Polyline
              key={route.id || route.number}
              positions={route.waypoints}
              color={route.color || '#2D6A4F'}
              weight={4}
              opacity={0.8}
            />
          ))}

          {/* Stops */}
          {displayStops.map(stop => (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={createStopIcon('#F4A261')}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm text-green-800">{stop.name}</p>
                  <p className="text-xs text-gray-500">Ruta {stop.route_number}</p>
                  {stop.next_arrival_minutes !== undefined && (
                    <p className="text-xs font-bold text-orange-500 mt-1">
                      🚌 Próximo en {stop.next_arrival_minutes} min
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Buses */}
          {displayBuses.map(bus => (
            <Marker
              key={bus.id || bus.bus_id}
              position={[bus.lat, bus.lng]}
              icon={createBusIcon(bus.color || '#2D6A4F')}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm text-green-800">Unidad {bus.bus_id}</p>
                  <p className="text-xs text-gray-500">Ruta {bus.route_number}</p>
                  <p className="text-xs mt-1">➡️ {bus.next_stop}</p>
                  <p className="text-xs">{OCCUPANCY_LABEL[bus.occupancy] || '🟡 Moderado'}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* User position */}
          {userPos && (
            <>
              <Marker position={userPos} icon={userIcon}>
                <Popup><p className="text-sm font-bold text-green-800">📍 Tu ubicación</p></Popup>
              </Marker>
              <Circle center={userPos} radius={200} color="#2D6A4F" fillColor="#2D6A4F" fillOpacity={0.1} />
            </>
          )}
        </MapContainer>

        {/* Live badge */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full z-[999]"
          style={{ backgroundColor: '#2D6A4F', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        >
          <div className="live-dot w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="text-white text-xs font-bold">{displayBuses.length} buses</span>
        </div>

        {/* Predictive AI Panel */}
        <PredictivePanel selectedRoute={selectedRoute} />
      </div>

      {/* Legend */}
      <div
        className="px-4 py-3 flex items-center gap-4 overflow-x-auto"
        style={{ backgroundColor: 'white', borderTop: '1px solid #F3F4F6' }}
      >
        <span className="text-xs font-black text-gray-500 flex-shrink-0">LEYENDA:</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center text-xs">🚌</div>
          <span className="text-xs text-gray-600">Autobús</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full border-2 border-orange-400 bg-white"></div>
          <span className="text-xs text-gray-600">Parada</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-green-700"></div>
          <span className="text-xs text-gray-600">Tú</span>
        </div>
      </div>
    </div>
  );
}