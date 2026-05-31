/**
 * Offline Cache — localStorage-backed cache for MueveCancún PWA
 * Stores: routes, alerts, userPoints, tickets
 */

const CACHE_KEYS = {
  routes: 'mc_routes',
  alerts: 'mc_alerts',
  userPoints: 'mc_user_points',
  tickets: 'mc_tickets',
  pushPrefs: 'mc_push_prefs',
  notifSchedule: 'mc_notif_schedule',
};

const CACHE_TTL = {
  routes: 24 * 60 * 60 * 1000,   // 24h
  alerts: 5 * 60 * 1000,          // 5 min
  userPoints: 10 * 60 * 1000,     // 10 min
  tickets: 7 * 24 * 60 * 60 * 1000, // 7 days
  pushPrefs: Infinity,
  notifSchedule: Infinity,
};

function set(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) {
    // Storage full — silently fail
  }
}

function get(key, ttl) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (ttl !== Infinity && Date.now() - ts > ttl) return null;
    return data;
  } catch {
    return null;
  }
}

function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}

export const offlineCache = {
  // Routes
  saveRoutes: (routes) => set(CACHE_KEYS.routes, routes),
  getRoutes: () => get(CACHE_KEYS.routes, CACHE_TTL.routes),

  // Alerts
  saveAlerts: (alerts) => set(CACHE_KEYS.alerts, alerts),
  getAlerts: () => get(CACHE_KEYS.alerts, CACHE_TTL.alerts),

  // User points / rewards
  saveUserPoints: (points) => set(CACHE_KEYS.userPoints, points),
  getUserPoints: () => get(CACHE_KEYS.userPoints, CACHE_TTL.userPoints),

  // Digital tickets
  saveTickets: (tickets) => set(CACHE_KEYS.tickets, tickets),
  getTickets: () => get(CACHE_KEYS.tickets, CACHE_TTL.tickets),
  addTicket: (ticket) => {
    const existing = offlineCache.getTickets() || [];
    const updated = [ticket, ...existing].slice(0, 50); // max 50 tickets
    set(CACHE_KEYS.tickets, updated);
    return updated;
  },

  // Push notification preferences
  savePushPrefs: (prefs) => set(CACHE_KEYS.pushPrefs, prefs),
  getPushPrefs: () => get(CACHE_KEYS.pushPrefs, Infinity),

  // Notification schedule
  saveNotifSchedule: (schedule) => set(CACHE_KEYS.notifSchedule, schedule),
  getNotifSchedule: () => get(CACHE_KEYS.notifSchedule, Infinity),

  // Utility
  isOnline: () => navigator.onLine,
  clearAll: () => Object.values(CACHE_KEYS).forEach(remove),
  getCacheSize: () => {
    let size = 0;
    Object.values(CACHE_KEYS).forEach(k => {
      const v = localStorage.getItem(k);
      if (v) size += v.length * 2; // bytes approx
    });
    return (size / 1024).toFixed(1) + ' KB';
  },
};

export default offlineCache;