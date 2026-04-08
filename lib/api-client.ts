import { REQUEST_TIMEOUT_MS, ERROR_MESSAGES } from '@/lib/constants';

export interface ApiClientOptions extends RequestInit {
  /** Ne pas afficher de toast sur erreur réseau / timeout */
  skipErrorToast?: boolean;
  /** Pour login/register : ne pas déclencher déconnexion sur 401 */
  skipUnauthorizedHandling?: boolean;
}

export const apiClientConfig = {
  onUnauthorized: () => {},
  onNetworkError: (_msg: string) => {},
};

export class ApiUnauthorizedError extends Error {
  constructor() {
    super('UNAUTHORIZED');
    this.name = 'ApiUnauthorizedError';
  }
}

function isAbortError(e: unknown): boolean {
  return e instanceof Error && e.name === 'AbortError';
}

async function fetchWithSignal(
  url: string,
  init: RequestInit,
  signal: AbortSignal
): Promise<Response> {
  return fetch(url, { ...init, signal });
}

/**
 * Fetch centralisé : timeout 10s, retry x1 sur 5xx, 401 → callback (sauf opt-out).
 */
export async function apiFetch(url: string, options?: ApiClientOptions): Promise<Response> {
  const {
    skipErrorToast,
    skipUnauthorizedHandling,
    signal: externalSignal,
    ...restInit
  } = options ?? {};

  const controller = new AbortController();
  const { signal } = controller;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const run = async (): Promise<Response> => {
    try {
      let res = await fetchWithSignal(url, restInit, signal);

      if (!skipUnauthorizedHandling && res.status === 401) {
        apiClientConfig.onUnauthorized();
        throw new ApiUnauthorizedError();
      }

      if (res.status >= 500 && res.status < 600) {
        res = await fetchWithSignal(url, restInit, signal);
        if (!skipUnauthorizedHandling && res.status === 401) {
          apiClientConfig.onUnauthorized();
          throw new ApiUnauthorizedError();
        }
      }

      return res;
    } catch (e) {
      if (e instanceof ApiUnauthorizedError) throw e;
      if (isAbortError(e)) {
        if (!skipErrorToast) {
          apiClientConfig.onNetworkError(ERROR_MESSAGES.SERVICE_UNAVAILABLE);
        }
        throw e;
      }
      if (!skipErrorToast) {
        apiClientConfig.onNetworkError(ERROR_MESSAGES.SERVICE_UNAVAILABLE);
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return run();
}
