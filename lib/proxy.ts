import { type NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import { AUTH_COOKIE, TENANT_COOKIE, REQUEST_TIMEOUT_MS } from './constants';

interface ProxyOptions {
  /** URL cible du service backend */
  targetUrl: string;
  /** Méthode HTTP (par défaut celle de la requête entrante) */
  method?: string;
  /** Remplacer le body (utile pour les GET sans body) */
  body?: BodyInit | null;
  /** Headers supplémentaires à ajouter */
  extraHeaders?: Record<string, string>;
}

/**
 * Effectue une requête HTTP via les modules http/https natifs de Node.js.
 * Contourne la liste de ports bloqués dans undici/fetch (ex. port 6000 = X11).
 */
function httpRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string | null,
): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers,
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const responseHeaders: Record<string, string> = {};
        Object.entries(res.headers).forEach(([k, v]) => {
          if (typeof v === 'string') responseHeaders[k] = v;
          else if (Array.isArray(v)) responseHeaders[k] = v.join(', ');
        });
        resolve({ status: res.statusCode ?? 500, headers: responseHeaders, body: data });
      });
    });

    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error('timeout'));
    });

    if (body) req.write(body);
    req.end();
  });
}

/**
 * Proxy une requête Next.js vers un service backend.
 * Extrait et forward automatiquement le JWT et le X-Tenant-ID.
 */
export async function proxyRequest(
  request: NextRequest,
  options: ProxyOptions,
): Promise<NextResponse> {
  const { targetUrl, method, body, extraHeaders = {} } = options;

  // Extraction du JWT depuis le cookie ou le header Authorization
  const tokenFromCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const tokenFromHeader = request.headers.get('authorization');
  const authHeader = tokenFromHeader ?? (tokenFromCookie ? `Bearer ${tokenFromCookie}` : undefined);

  // Extraction du Tenant ID depuis le cookie ou le header
  const tenantFromCookie = request.cookies.get(TENANT_COOKIE)?.value;
  const tenantFromHeader = request.headers.get('x-tenant-id');
  const tenantId = tenantFromHeader ?? tenantFromCookie;

  // Construction des headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (authHeader) headers['Authorization'] = authHeader;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  // Détermination du body
  const requestMethod = method ?? request.method;
  let requestBody: string | null = null;

  if (body === null) {
    requestBody = null;
  } else if (typeof body === 'string') {
    requestBody = body;
  } else if (!['GET', 'HEAD'].includes(requestMethod)) {
    try {
      const text = await request.text();
      requestBody = text || null;
    } catch {
      requestBody = null;
    }
  }

  try {
    const result = await httpRequest(targetUrl, requestMethod, headers, requestBody);

    const contentType = result.headers['content-type'] ?? '';
    if (contentType.includes('application/json')) {
      try {
        const json: unknown = JSON.parse(result.body);
        return NextResponse.json(json, { status: result.status });
      } catch {
        return new NextResponse(result.body, {
          status: result.status,
          headers: { 'Content-Type': contentType },
        });
      }
    }

    return new NextResponse(result.body, {
      status: result.status,
      headers: { 'Content-Type': contentType || 'text/plain' },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'timeout') {
      return NextResponse.json(
        { message: 'La requête a expiré. Veuillez réessayer.' },
        { status: 504 },
      );
    }
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service';
    return NextResponse.json({ message }, { status: 502 });
  }
}

/**
 * Helper pour construire une URL avec les query params de la requête entrante.
 */
export function buildUrl(base: string, request: NextRequest, extraParams?: Record<string, string>): string {
  const url = new URL(base);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}
