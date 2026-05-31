import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered by entity automation when an Alert is created or updated with is_active=true.
 * Also callable directly from the admin panel to manually dispatch an alert.
 *
 * Payload (from automation or direct call):
 *   { alert_id, event: { type } }  ← from entity automation
 *   { alert_id }                    ← direct admin call
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Support both automation payload (data.id) and direct call (alert_id)
    const alertId = body.alert_id || body.event?.entity_id || body.data?.id;

    if (!alertId) {
      console.error('dispatchAlertNotification: no alert_id in payload', body);
      return Response.json({ error: 'Missing alert_id' }, { status: 400 });
    }

    // Fetch the alert
    const alerts = await base44.asServiceRole.entities.Alert.filter({ id: alertId });
    const alert = alerts[0];

    if (!alert) {
      console.warn('dispatchAlertNotification: alert not found', alertId);
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Only dispatch for active alerts
    if (!alert.is_active) {
      console.log('dispatchAlertNotification: skipping inactive alert', alertId);
      return Response.json({ skipped: true, reason: 'Alert is not active' });
    }

    // Map alert type to notification preference type
    const typeMap = {
      delay: 'delay',
      cancellation: 'incident',
      detour: 'schedule',
      info: 'schedule',
      emergency: 'incident',
    };
    const notifType = typeMap[alert.type] || 'schedule';

    // Build push title & message
    const severityPrefix = alert.severity === 'high' ? '🚨 ' : alert.severity === 'medium' ? '⚠️ ' : 'ℹ️ ';
    const pushTitle = `${severityPrefix}${alert.title}`;
    const pushMessage = alert.message.length > 160
      ? alert.message.slice(0, 157) + '…'
      : alert.message;

    // Get active subscriptions
    const allSubs = await base44.asServiceRole.entities.PushSubscription.filter({ is_active: true });

    // Filter by route preference
    const targetSubs = alert.route_number
      ? allSubs.filter(s =>
          !s.favorite_routes ||
          s.favorite_routes.length === 0 ||
          s.favorite_routes.includes(alert.route_number)
        )
      : allSubs;

    // Filter by notification preference
    const filteredSubs = targetSubs.filter(s => {
      if (notifType === 'delay' && s.notify_delays === false) return false;
      if (notifType === 'schedule' && s.notify_schedule === false) return false;
      if (notifType === 'incident' && s.notify_incidents === false) return false;
      return true;
    });

    console.log(`dispatchAlertNotification: alert="${alert.title}" route=${alert.route_number || 'all'} targets=${filteredSubs.length}/${allSubs.length}`);

    if (filteredSubs.length === 0) {
      return Response.json({ success: true, sent: 0, reason: 'No matching subscribers' });
    }

    // Attempt VAPID web push if keys are configured
    const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      console.warn('VAPID keys not set — alert saved as in-app only');
      return Response.json({
        success: true,
        mode: 'in_app_only',
        targets_count: filteredSubs.length,
        alert_id: alertId,
      });
    }

    const webpush = await import('npm:web-push@3.6.7');
    webpush.default.setVapidDetails('mailto:contacto@muevecancun.mx', VAPID_PUBLIC, VAPID_PRIVATE);

    const payload = JSON.stringify({
      title: pushTitle,
      body: pushMessage,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: `alert-${alertId}`,
      data: {
        alert_id: alertId,
        route_number: alert.route_number,
        type: alert.type,
        url: '/alertas',
      },
    });

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const sub of filteredSubs) {
      try {
        await webpush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (e) {
        console.error(`Push failed for ${sub.user_email}:`, e.message);
        failed++;
        errors.push({ email: sub.user_email, error: e.message });
        // Deactivate expired/invalid subscriptions (HTTP 410 Gone)
        if (e.statusCode === 410 || e.statusCode === 404) {
          await base44.asServiceRole.entities.PushSubscription.update(sub.id, { is_active: false });
          console.log(`Deactivated stale subscription for ${sub.user_email}`);
        }
      }
    }

    return Response.json({
      success: true,
      mode: 'push',
      alert_id: alertId,
      route_number: alert.route_number || 'all',
      sent,
      failed,
      targets_count: filteredSubs.length,
      errors: errors.slice(0, 5), // return first 5 errors max
    });

  } catch (error) {
    console.error('dispatchAlertNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});