const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Effectue un fetch avec annulation après le délai donné.
 * @param url URL cible
 * @param options Options fetch
 * @param timeout Délai avant annulation en ms
 * @param timeoutMessage Message d'erreur en cas de dépassement
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT_MS,
  timeoutMessage = 'Timeout: le service ne répond pas',
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const TIMEOUT_MS = DEFAULT_TIMEOUT_MS;

