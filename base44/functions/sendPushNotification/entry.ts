import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { route_number, type, title, message, target_emails } = body;

    // Get all active subscriptions
    const allSubs = await base44.asServiceRole.entities.PushSubscription.filter({ is_active: true });

    // Filter by route if specified
    const targets = route_number
      ? allSubs.filter(s => !s.favorite_routes || s.favorite_routes.length === 0 || s.favorite_routes.includes(route_number))
      : allSubs;

    // Filter by preference type
    const filtered = targets.filter(s => {
      if (type === 'delay' && s.notify_delays === false) return false;
      if (type === 'schedule' && s.notify_schedule === false) return false;
      if (type === 'incident' && s.notify_incidents === false) return false;
      return true;
    });

    // Store notification in alerts entity for in-app display
    await base44.asServiceRole.entities.Alert.create({
      title: title || `Aviso Ruta ${route_number}`,
      message: message || 'Actualización de servicio.',
      type: type === 'delay' ? 'delay' : type === 'incident' ? 'emergency' : 'info',
      route_number: route_number || '',
      severity: type === 'incident' ? 'high' : type === 'delay' ? 'medium' : 'low',
      is_active: true,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    });

    // Use Web Push API via Deno
    // Since Deno doesn't have native web-push, we use the VAPID-signed fetch approach
    // For now, we log the notification targets and return success
    // Real push requires a VAPID key pair — we return instructions if not configured
    const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      console.warn('VAPID keys not configured — notification saved as in-app alert only');
      return Response.json({
        success: true,
        mode: 'in_app_only',
        targets_count: filtered.length,
        message: 'Alerta guardada en la app. Para notificaciones push, configura VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.',
      });
    }

    // Send via web-push npm package
    const webpush = await import('npm:web-push@3.6.7');
    webpush.default.setVapidDetails(
      'mailto:admin@muevecancun.mx',
      VAPID_PUBLIC,
      VAPID_PRIVATE
    );

    const payload = JSON.stringify({ title, body: message, icon: '/icon-192.png', badge: '/icon-72.png', data: { route_number, type } });

    let sent = 0;
    let failed = 0;
    for (const sub of filtered) {
      try {
        await webpush.default.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        sent++;
      } catch (e) {
        console.error('Push failed for', sub.user_email, e.message);
        failed++;
        if (e.statusCode === 410) {
          await base44.asServiceRole.entities.PushSubscription.update(sub.id, { is_active: false });
        }
      }
    }

    return Response.json({ success: true, mode: 'push', sent, failed, targets_count: filtered.length });

  } catch (error) {
    console.error('sendPushNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});