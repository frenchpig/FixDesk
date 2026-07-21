// Responsabilidad: pantalla de bloqueo mientras la API arranca (cold start)
// Usado por: ApiWakeProvider
// NO hace: polling ni llamadas HTTP

'use client';

import { Text } from '@/components/atoms/Text';

interface ApiWakeScreenProps {
  secondsLeft: number;
  hasExtended: boolean;
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ApiWakeScreen({
  secondsLeft,
  hasExtended,
}: ApiWakeScreenProps) {
  const exhausted = hasExtended && secondsLeft === 0;

  return (
    <div
      className="relative z-50 flex min-h-dvh items-center justify-center px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface/90 p-8 text-center shadow-lg backdrop-blur-sm">
        <Text as="h1" variant="h2" className="mb-3">
          FixDesk se está iniciando
        </Text>
        <Text variant="muted" className="mb-6">
          El servidor estuvo inactivo y está volviendo a encenderse. Esto puede
          tardar uno o dos minutos. Por favor, espera sin cerrar esta página.
        </Text>

        {exhausted ? (
          <Text variant="body" className="font-medium">
            Sigue iniciando… te avisaremos en cuanto esté listo.
          </Text>
        ) : (
          <>
            <Text
              as="p"
              variant="h1"
              className="mb-2 tabular-nums tracking-wider"
              aria-label={`Tiempo estimado restante: ${formatCountdown(secondsLeft)}`}
            >
              {formatCountdown(secondsLeft)}
            </Text>
            <Text variant="caption">
              {hasExtended
                ? 'Tiempo adicional de espera'
                : 'Tiempo estimado de arranque'}
            </Text>
          </>
        )}
      </div>
    </div>
  );
}
