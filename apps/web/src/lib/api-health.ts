// Responsabilidad: comprobar si la API responde OK en /health
// Usado por: api-wake-context
// NO hace: autenticación ni otras rutas de negocio

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const HEALTH_TIMEOUT_MS = 7_000;

/**
 * Devuelve true solo si GET /health responde con status === 'ok'.
 * Timeouts y errores de red cuentan como no disponible.
 */
export async function checkApiHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) return false;

    const body = (await res.json()) as { status?: string };
    return body.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
