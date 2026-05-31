import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Simulates bus movement along Cancún routes every 5 minutes
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active buses
    const buses = await base44.asServiceRole.entities.BusPosition.filter({ is_active: true });

    if (!buses || buses.length === 0) {
      return Response.json({ message: 'No active buses found', updated: 0 });
    }

    // Route waypoints for simulation (simplified Cancún routes)
    const routeSegments = {
      'R1': {
        waypoints: [
          [21.1619, -86.8515], [21.155, -86.838], [21.145, -86.82],
          [21.13, -86.795], [21.12, -86.78], [21.105, -86.76]
        ],
        stops: ['Terminal Centro', 'Plaza Las Américas', 'Km 9 Kukulcán', 'Km 12 ZH', 'El Rey']
      },
      'R2': {
        waypoints: [
          [21.0365, -86.877], [21.06, -86.86], [21.09, -86.855],
          [21.12, -86.85], [21.1619, -86.8515]
        ],
        stops: ['Aeropuerto', 'Huayacán', 'SM 12', 'Centro']
      },
      'R13': {
        waypoints: [
          [21.18, -86.84], [21.17, -86.83], [21.155, -86.81], [21.13, -86.79]
        ],
        stops: ['SM 64', 'SM 45', 'Km 5 ZH', 'Km 18 ZH']
      },
      'EXP': {
        waypoints: [
          [21.1619, -86.8515], [21.145, -86.82], [21.12, -86.78]
        ],
        stops: ['Centro', 'Plaza Américas', 'Km 12 ZH']
      }
    };

    const occupancies = ['empty', 'low', 'medium', 'high'];
    let updatedCount = 0;

    for (const bus of buses) {
      const route = routeSegments[bus.route_number];
      if (!route) continue;

      const waypoints = route.waypoints;
      const randomIdx = Math.floor(Math.random() * (waypoints.length - 1));
      const wp = waypoints[randomIdx];

      // Add small random offset to simulate realistic movement
      const newLat = wp[0] + (Math.random() - 0.5) * 0.003;
      const newLng = wp[1] + (Math.random() - 0.5) * 0.003;
      const nextStopIdx = Math.min(randomIdx + 1, route.stops.length - 1);

      await base44.asServiceRole.entities.BusPosition.update(bus.id, {
        lat: newLat,
        lng: newLng,
        speed_kmh: 20 + Math.floor(Math.random() * 40),
        occupancy: occupancies[Math.floor(Math.random() * occupancies.length)],
        next_stop: route.stops[nextStopIdx],
        minutes_to_next_stop: 1 + Math.floor(Math.random() * 15),
        last_updated: new Date().toISOString(),
      });

      updatedCount++;
    }

    return Response.json({
      message: 'Bus positions updated successfully',
      updated: updatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});