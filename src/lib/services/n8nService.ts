import { connectionService } from './connectionService';

export interface N8nTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  statusCode?: number;
}

export interface N8nIncidentPayload {
  eventType: 'firing' | 'resolved';
  incidentId: string;
  serviceId: string;
  serviceName: string;
  metricTrigger: string;
  severity: string;
  technicalDetail: string;
  timestamp: string;
}

export const n8nService = {
  /**
   * Prueba en vivo la conectividad con una instancia de n8n.
   * Valida el endpoint de salud /healthz y opcionalmente el token en /api/v1/workflows.
   */
  async testConnection(
    rawUrl: string, 
    authType: 'none' | 'basic' | 'bearer' = 'none', 
    authCredentials?: string
  ): Promise<N8nTestResult> {
    const startTime = Date.now();
    try {
      if (!rawUrl) {
        return { success: false, message: 'La URL de n8n es requerida' };
      }

      const normalizedUrl = rawUrl.replace(/\/+$/, '');
      const healthUrl = `${normalizedUrl}/healthz`;

      const headers: Record<string, string> = {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'NOC-NOC-Monitor/1.0'
      };

      if (authType === 'bearer' && authCredentials) {
        // n8n soporta tanto X-N8N-API-KEY como Authorization: Bearer
        headers['X-N8N-API-KEY'] = authCredentials;
        headers['Authorization'] = `Bearer ${authCredentials}`;
      } else if (authType === 'basic' && authCredentials) {
        const encoded = Buffer.from(authCredentials).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      }

      // 1. Primer intento: endpoint /healthz nativo de n8n
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let response: Response;
      try {
        response = await fetch(healthUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
          cache: 'no-store',
          redirect: 'manual'
        });
      } catch (healthErr: any) {
        // Si /healthz falla, intentamos la raíz o /api/v1/workflows
        clearTimeout(timeoutId);
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 6000);

        const targetFallback = (authType === 'bearer' && authCredentials)
          ? `${normalizedUrl}/api/v1/workflows?limit=1`
          : normalizedUrl;

        response = await fetch(targetFallback, {
          method: 'GET',
          headers,
          signal: fallbackController.signal,
          cache: 'no-store',
          redirect: 'manual'
        });
        clearTimeout(fallbackTimeout);
      } finally {
        clearTimeout(timeoutId);
      }

      const latencyMs = Date.now() - startTime;

      // Si responde con redirección a un portal SSO (Pangolin, Cloudflare Access, Pomerium, etc.)
      if (response.status >= 300 && response.status < 400) {
        // Sondeo de contingencia: Si /healthz está protegido por SSO, probamos si el canal de Webhook está abierto y responde desde n8n
        try {
          const webhookProbeUrl = `${normalizedUrl}/webhook/noc-noc-incident`;
          const wbRes = await fetch(webhookProbeUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(3000),
            redirect: 'manual'
          });
          const wbType = wbRes.headers.get('content-type') || '';
          if (wbType.includes('application/json')) {
            const probeLatency = Date.now() - startTime;
            return {
              success: true,
              message: `Canal Webhook ONLINE (${probeLatency}ms) — Motor operativo (API protegida por SSO)`,
              latencyMs: probeLatency,
              statusCode: 200
            };
          }
        } catch {
          // Si el sondeo falla, continúa con el mensaje de redirección estándar
        }

        const redirectLocation = response.headers.get('location') || '';
        return {
          success: false,
          message: `Instancia detrás de un proxy Zero-Trust / SSO (HTTP ${response.status}). Redirige a: ${redirectLocation}. Configura bypass para '/healthz' y '/api/*' en Pangolin.`,
          latencyMs,
          statusCode: response.status
        };
      }

      // Si responde 200 pero devuelve una página HTML de login
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return {
          success: false,
          message: `El servidor devolvió HTML en vez de n8n. La petición está siendo interceptada por un portal de autenticación o proxy SSO.`,
          latencyMs,
          statusCode: response.status
        };
      }

      if (response.ok || response.status === 200) {
        return {
          success: true,
          message: `Conexión exitosa con n8n (${latencyMs}ms)`,
          latencyMs,
          statusCode: response.status
        };
      }

      // Si responde 401/403, el servidor está arriba pero las credenciales no son válidas
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          message: `Instancia de n8n alcanzada, pero la API Key o credenciales fueron rechazadas (HTTP ${response.status})`,
          latencyMs,
          statusCode: response.status
        };
      }

      return {
        success: false,
        message: `n8n respondió con código de estado HTTP ${response.status}: ${response.statusText}`,
        latencyMs,
        statusCode: response.status
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: `Tiempo de espera agotado al conectar a n8n (>6s). Verifica la IP y el puerto.`,
          latencyMs
        };
      }
      return {
        success: false,
        message: `Fallo al contactar n8n: ${error.message || 'Error de red'}`,
        latencyMs
      };
    }
  },

  /**
   * Obtiene la conexión activa de n8n desde la base de datos
   */
  async getActiveConnection() {
    return connectionService.getActiveConnection('n8n');
  },

  /**
   * Consulta la lista de workflows en n8n mediante su API REST pública
   */
  async getWorkflows(): Promise<{ success: boolean; workflows: any[]; error?: string }> {
    try {
      const conn = await this.getActiveConnection();
      if (!conn || !conn.isActive || !conn.url) {
        return { success: false, workflows: [], error: 'n8n no está configurado o está inactivo' };
      }

      if (conn.authType !== 'bearer' || !conn.authCredentials) {
        return { success: false, workflows: [], error: 'Se requiere una API Key (Bearer) configurada para consultar los workflows de n8n' };
      }

      const normalizedUrl = conn.url.replace(/\/+$/, '');
      const apiUrl = `${normalizedUrl}/api/v1/workflows?limit=50`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-N8N-API-KEY': conn.authCredentials,
          'Authorization': `Bearer ${conn.authCredentials}`
        },
        signal: controller.signal,
        cache: 'no-store',
        redirect: 'manual'
      });
      clearTimeout(timeoutId);

      if (res.status >= 300 && res.status < 400) {
        return {
          success: false,
          workflows: [],
          error: `La API REST (/api/*) fue interceptada por el proxy Pangolin (HTTP ${res.status}). Agrega '/api/*' en las rutas públicas de Pangolin.`
        };
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return {
          success: false,
          workflows: [],
          error: 'El proxy Pangolin devolvió HTML en vez de la API JSON de n8n. Agrega /api/* a las rutas públicas (Bypass) en Pangolin.'
        };
      }

      if (!res.ok) {
        return { success: false, workflows: [], error: `n8n API respondió con HTTP ${res.status}: ${res.statusText}` };
      }

      const json = await res.json();
      const rawList = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      
      const workflows = rawList.map((wf: any) => ({
        id: wf.id,
        name: wf.name || 'Sin nombre',
        active: Boolean(wf.active),
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
        tags: Array.isArray(wf.tags) ? wf.tags.map((t: any) => t.name || t) : []
      }));

      return { success: true, workflows };
    } catch (err: any) {
      return { success: false, workflows: [], error: err.name === 'AbortError' ? 'Timeout al consultar workflows (>6s)' : err.message };
    }
  },

  /**
   * Despacha un evento de alerta a n8n de forma asíncrona y tolerante a fallos
   */
  async dispatchIncidentEvent(
    payload: N8nIncidentPayload, 
    options?: { isTestWebhook?: boolean }
  ): Promise<{ success: boolean; statusCode?: number; latencyMs?: number; message: string; targetUrl?: string }> {
    const startTime = Date.now();
    try {
      const conn = await this.getActiveConnection();
      if (!conn || !conn.isActive || !conn.url) {
        return { success: false, message: 'La integración con n8n no está configurada o está inactiva' };
      }

      const normalizedUrl = conn.url.replace(/\/+$/, '');
      const webhookSuffix = options?.isTestWebhook 
        ? '/webhook-test/noc-noc-incident' 
        : '/webhook/noc-noc-incident';

      const targetUrl = normalizedUrl.includes('/webhook') 
        ? (options?.isTestWebhook ? normalizedUrl.replace(/\/webhook\/?/, '/webhook-test/') : normalizedUrl)
        : `${normalizedUrl}${webhookSuffix}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'NOC-NOC-Dispatcher/1.0'
      };

      if (conn.authCredentials) {
        if (conn.authType === 'bearer') {
          headers['X-N8N-API-KEY'] = conn.authCredentials;
          headers['Authorization'] = `Bearer ${conn.authCredentials}`;
        } else if (conn.authType === 'basic') {
          const encoded = Buffer.from(conn.authCredentials).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
        redirect: 'manual'
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      // Detección de redirección por Proxy Zero-Trust / SSO (Pangolin, Cloudflare Access, etc.)
      if (res.status >= 300 && res.status < 400) {
        const redirectLocation = res.headers.get('location') || '';
        return {
          success: false,
          statusCode: res.status,
          latencyMs,
          targetUrl,
          message: `Bloqueado por Proxy Zero-Trust / SSO (HTTP ${res.status}). Redirigido a: ${redirectLocation}. Debes configurar una excepción pública (Bypass) para '/webhook/*' y '/webhook-test/*' en Pangolin.`
        };
      }

      // Detección si devolvió una página HTML en lugar de procesar el webhook
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return {
          success: false,
          statusCode: res.status,
          latencyMs,
          targetUrl,
          message: `El servidor devolvió una página HTML en vez de aceptar el webhook. La petición fue interceptada por un portal de autenticación SSO.`
        };
      }

      if (res.ok) {
        return { 
          success: true, 
          statusCode: res.status, 
          latencyMs, 
          targetUrl,
          message: `Evento entregado exitosamente a n8n (${latencyMs}ms)` 
        };
      }

      return {
        success: false,
        statusCode: res.status,
        latencyMs,
        targetUrl,
        message: `n8n webhook respondió con código HTTP ${res.status}: ${res.statusText}`
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err.name === 'AbortError' ? 'Tiempo de espera agotado (>6s)' : (err.message || 'Error de red');
      console.warn('[n8nService] Fallo al despachar incidente a n8n:', errorMsg);
      return { success: false, latencyMs, message: errorMsg };
    }
  }
};
