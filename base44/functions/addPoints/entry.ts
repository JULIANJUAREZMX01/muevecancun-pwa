import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LEVELS = [
  { level: 1, name: 'Viajero Inicial', min: 0, badge: '🚶' },
  { level: 2, name: 'Pasajero Regular', min: 100, badge: '🎫' },
  { level: 3, name: 'Explorador Urbano', min: 300, badge: '🗺️' },
  { level: 4, name: 'Frecuentador Pro', min: 600, badge: '⭐' },
  { level: 5, name: 'Embajador Cancún', min: 1000, badge: '🏆' },
  { level: 6, name: 'Leyenda del Metro', min: 2000, badge: '🦜' },
];

const POINT_VALUES = {
  trip: 10,
  report: 25,
  alert_read: 5,
  consecutive_day: 15,
  favorite_route: 20,
  first_trip: 50,
};

function computeLevel(points) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (points >= lvl.min) current = lvl;
  }
  return current;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'trip'; // trip | report | alert_read | consecutive_day | favorite_route

    const pointsToAdd = POINT_VALUES[action] ?? 5;

    // Find or create user points record
    const existing = await base44.entities.UserPoints.filter({ user_email: user.email });
    let record = existing[0];

    if (!record) {
      // First trip bonus
      const bonus = action === 'trip' ? POINT_VALUES.first_trip : 0;
      const total = pointsToAdd + bonus;
      const lvl = computeLevel(total);
      record = await base44.entities.UserPoints.create({
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        total_points: total,
        level: lvl.level,
        level_name: lvl.name,
        trips_count: action === 'trip' ? 1 : 0,
        reports_count: action === 'report' ? 1 : 0,
        alerts_read: action === 'alert_read' ? 1 : 0,
        consecutive_days: 1,
        badges: [lvl.badge],
        last_activity: new Date().toISOString(),
      });
      return Response.json({ success: true, points_added: total, record, level_up: false, is_new: true });
    }

    const newTotal = (record.total_points || 0) + pointsToAdd;
    const oldLevel = record.level || 1;
    const newLvl = computeLevel(newTotal);
    const levelUp = newLvl.level > oldLevel;

    const updates = {
      total_points: newTotal,
      level: newLvl.level,
      level_name: newLvl.name,
      last_activity: new Date().toISOString(),
    };
    if (action === 'trip') updates.trips_count = (record.trips_count || 0) + 1;
    if (action === 'report') updates.reports_count = (record.reports_count || 0) + 1;
    if (action === 'alert_read') updates.alerts_read = (record.alerts_read || 0) + 1;

    if (levelUp) {
      const badges = [...(record.badges || [])];
      if (!badges.includes(newLvl.badge)) badges.push(newLvl.badge);
      updates.badges = badges;
    }

    const updated = await base44.entities.UserPoints.update(record.id, updates);
    return Response.json({ success: true, points_added: pointsToAdd, record: updated, level_up: levelUp, new_level: levelUp ? newLvl : null });

  } catch (error) {
    console.error('addPoints error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});