// Responsabilidad: resolver umbral SLA (horas) desde variables de entorno
// Usado por: SettingsService (fallback cuando no hay fila en DB)
// NO hace: persistir en DB ni UI de administración
import { ConfigService } from '@nestjs/config';

const DEFAULT_SLA_TARGET_HOURS = 48;

/**
 * Lee `SLA_TARGET_HOURS` desde config/env.
 * Valores inválidos o no positivos caen al default (48).
 */
export function resolveSlaTargetHoursFromEnv(config: ConfigService): number {
  const raw = config.get<string | number>('SLA_TARGET_HOURS');
  const parsed =
    typeof raw === 'number' ? raw : Number.parseFloat(String(raw ?? ''));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SLA_TARGET_HOURS;
  }

  return Math.round(parsed);
}

/** Alias histórico; preferir resolveSlaTargetHoursFromEnv. */
export function resolveSlaTargetHours(config: ConfigService): number {
  return resolveSlaTargetHoursFromEnv(config);
}
