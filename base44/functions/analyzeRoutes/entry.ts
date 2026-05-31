import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch routes, bus positions and alerts for analysis
    const [routes, busPositions, alerts] = await Promise.all([
      base44.asServiceRole.entities.Route.list(),
      base44.asServiceRole.entities.BusPosition.list(),
      base44.asServiceRole.entities.Alert.filter({ is_active: true }),
    ]);

    // Build a rich context string for the LLM
    const routeSummary = routes.map(r =>
      `Ruta ${r.number} (${r.name}): estado=${r.status || 'active'}, frecuencia=${r.frequency_minutes || '?'} min, paradas=${r.stops_count || '?'}, tarifa=$${r.fare || 12} MXN`
    ).join('\n');

    const busSummary = busPositions.map(b =>
      `Bus ${b.bus_id} en ruta ${b.route_number}: ocupación=${b.occupancy || 'medium'}, velocidad=${b.speed_kmh || '?'} km/h, próxima parada=${b.next_stop || '?'}`
    ).join('\n');

    const alertSummary = alerts.length > 0
      ? alerts.map(a => `[${a.type}/${a.severity}] Ruta ${a.route_number || 'general'}: ${a.title}`).join('\n')
      : 'Sin alertas activas.';

    const prompt = `Eres un experto en optimización de transporte público urbano para Cancún, México.

Analiza los siguientes datos operativos actuales y proporciona recomendaciones concretas de optimización:

=== RUTAS ACTIVAS ===
${routeSummary || 'Sin datos de rutas.'}

=== POSICIONES DE AUTOBUSES EN TIEMPO REAL ===
${busSummary || 'Sin datos de buses.'}

=== ALERTAS DE SERVICIO ACTIVAS ===
${alertSummary}

Con base en estos datos, proporciona un análisis estructurado con:
1. DIAGNÓSTICO: identifica los 3 principales problemas operativos
2. OPTIMIZACIONES: sugiere 4-5 mejoras concretas y accionables (frecuencias, redistribución de flota, nuevas paradas, etc.)
3. PRIORIDAD: clasifica cada optimización como ALTA, MEDIA o BAJA según impacto y urgencia
4. KPIs ESPERADOS: estima el % de mejora en tiempo de espera, cobertura y eficiencia de flota

Sé específico con números y rutas. Responde en español.`;

    const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY');
    if (!hfApiKey) {
      console.error('HUGGINGFACE_API_KEY not set');
      return Response.json({ error: 'HUGGINGFACE_API_KEY no configurada' }, { status: 500 });
    }

    // Use Hugging Face Inference API with a capable text-generation model
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${prompt} [/INST]`,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.4,
            return_full_text: false,
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      const err = await hfResponse.text();
      console.error('HuggingFace error:', err);
      return Response.json({ error: `Error de Hugging Face: ${hfResponse.status}`, details: err }, { status: 502 });
    }

    const hfData = await hfResponse.json();
    const analysisText = Array.isArray(hfData)
      ? hfData[0]?.generated_text || ''
      : hfData?.generated_text || '';

    // Parse sections from the response
    const parseSection = (text, label) => {
      const regex = new RegExp(`${label}[:\\s]*(.*?)(?=\\n[0-9A-ZÁÉÍÓÚ]|$)`, 'is');
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };

    return Response.json({
      success: true,
      analysis: analysisText,
      metadata: {
        routes_analyzed: routes.length,
        buses_tracked: busPositions.length,
        active_alerts: alerts.length,
        generated_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('analyzeRoutes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});