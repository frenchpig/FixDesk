// Responsabilidad: resolver límites antiabuso desde variables de entorno
// Usado por: AppModule y AuthController
// NO hace: almacenar contadores ni aplicar guards HTTP

export const DEFAULT_THROTTLE_TTL_MS = 60_000;
export const DEFAULT_THROTTLE_LIMIT = 120;
export const DEFAULT_AUTH_THROTTLE_LIMIT = 10;

/**
 * Convierte una variable de entorno en un entero positivo o usa su fallback.
 * @param rawValue - Valor recibido desde configuración.
 * @param fallback - Valor seguro usado cuando la variable no está definida.
 * @param variableName - Nombre mostrado cuando la configuración es inválida.
 * @returns Entero positivo listo para configurar el throttler.
 * @throws {Error} Si la variable está definida pero no es un entero positivo.
 */
export function resolvePositiveInteger(
  rawValue: string | number | undefined,
  fallback: number,
  variableName: string,
): number {
  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }

  const value =
    typeof rawValue === 'number' ? rawValue : Number.parseInt(rawValue, 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${variableName} debe ser un entero positivo`);
  }

  return value;
}
