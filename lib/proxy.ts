import { type NextRequest, NextResponse } from 'next/server';
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

  // Construction des headers à forwarder
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (authHeader) headers['Authorization'] = authHeader;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  // Détermination du body à envoyer
  const requestMethod = method ?? request.method;
  let requestBody: BodyInit | null | undefined = body;
  if (requestBody === undefined && !['GET', 'HEAD'].includes(requestMethod)) {
    try {
      const text = await request.text();
      requestBody = text || null;
    } catch {
      requestBody = null;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: requestMethod,
      headers,
      body: requestBody ?? undefined,
      signal: controller.signal,
    });

    // Lire le body de réponse
    const contentType = response.headers.get('content-type') ?? '';
    let data: unknown;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (typeof data === 'string') {
      return new NextResponse(data, {
        status: response.status,
        headers: { 'Content-Type': contentType },
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { message: 'La requête a expiré. Veuillez réessayer.' },
        { status: 504 },
      );
    }
    const message = error instanceof Error ? error.message : 'Erreur de connexion au service';
    return NextResponse.json({ message }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
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
