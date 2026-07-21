// Responsabilidad: bloquear la app hasta que la API responda health OK
// Usado por: app/layout.tsx
// NO hace: llamadas de negocio ni autenticación

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { checkApiHealth } from '@/lib/api-health';
import { ApiWakeScreen } from '@/components/organisms/ApiWakeScreen';

const INITIAL_SECONDS = 60;
const EXTENSION_SECONDS = 60;
const POLL_BLOCKED_MS = 3_000;
const POLL_READY_MS = 15_000;

interface ApiWakeContextValue {
  isReady: boolean;
  secondsLeft: number;
  hasExtended: boolean;
}

const ApiWakeContext = createContext<ApiWakeContextValue | null>(null);

export function ApiWakeProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [hasExtended, setHasExtended] = useState(false);

  const isReadyRef = useRef(false);
  const hasExtendedRef = useRef(false);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    hasExtendedRef.current = hasExtended;
  }, [hasExtended]);

  const enterBlockedState = useCallback(() => {
    setIsReady(false);
    setHasExtended(false);
    setSecondsLeft(INITIAL_SECONDS);
    hasExtendedRef.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      const ok = await checkApiHealth();
      if (cancelled) return;

      if (ok) {
        setIsReady(true);
        pollTimer = setTimeout(poll, POLL_READY_MS);
        return;
      }

      if (isReadyRef.current) {
        enterBlockedState();
      }

      pollTimer = setTimeout(poll, POLL_BLOCKED_MS);
    }

    void poll();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [enterBlockedState]);

  useEffect(() => {
    if (isReady) return;

    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (!hasExtendedRef.current) {
          hasExtendedRef.current = true;
          setHasExtended(true);
          return EXTENSION_SECONDS;
        }

        return 0;
      });
    }, 1_000);

    return () => clearInterval(tick);
  }, [isReady]);

  const value: ApiWakeContextValue = {
    isReady,
    secondsLeft,
    hasExtended,
  };

  if (!isReady) {
    return (
      <ApiWakeContext.Provider value={value}>
        <ApiWakeScreen secondsLeft={secondsLeft} hasExtended={hasExtended} />
      </ApiWakeContext.Provider>
    );
  }

  return (
    <ApiWakeContext.Provider value={value}>{children}</ApiWakeContext.Provider>
  );
}

export function useApiWake() {
  const ctx = useContext(ApiWakeContext);
  if (!ctx) throw new Error('useApiWake debe usarse dentro de ApiWakeProvider');
  return ctx;
}
