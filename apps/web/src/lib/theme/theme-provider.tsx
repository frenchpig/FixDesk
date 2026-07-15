'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { applyDesignTokens } from './apply-theme';
import {
  defaultThemePreference,
  getAvailableThemes,
  getThemeTokens,
  loadThemePreference,
  normalizePreference,
  saveThemePreference,
} from '@/themes/registry';
import type { ColorMode, ThemeId, ThemePreference } from '@/themes/types';

interface ThemeContextValue {
  themeId: ThemeId;
  mode: ColorMode;
  performanceMode: boolean;
  setThemeId: (id: ThemeId) => void;
  setMode: (mode: ColorMode) => void;
  setPerformanceMode: (enabled: boolean) => void;
  setPreference: (preference: ThemePreference) => void;
  availableThemes: ReturnType<typeof getAvailableThemes>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function persistAndApply(preference: ThemePreference) {
  const normalized = normalizePreference(preference);
  const tokens = getThemeTokens(normalized.themeId, normalized.mode);
  applyDesignTokens(
    tokens,
    normalized.themeId,
    normalized.mode,
    normalized.performanceMode,
  );
  saveThemePreference(normalized);
  return normalized;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    defaultThemePreference,
  );

  useEffect(() => {
    const stored = loadThemePreference();
    const normalized = persistAndApply(stored);
    setPreferenceState(normalized);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    const normalized = persistAndApply(next);
    setPreferenceState(normalized);
  }, []);

  const setThemeId = useCallback((themeId: ThemeId) => {
    setPreferenceState((prev) => {
      const normalized = persistAndApply({ ...prev, themeId });
      return normalized;
    });
  }, []);

  const setMode = useCallback((mode: ColorMode) => {
    setPreferenceState((prev) => {
      const normalized = persistAndApply({ ...prev, mode });
      return normalized;
    });
  }, []);

  const setPerformanceMode = useCallback((performanceMode: boolean) => {
    setPreferenceState((prev) => {
      const normalized = persistAndApply({ ...prev, performanceMode });
      return normalized;
    });
  }, []);

  const value = useMemo(
    () => ({
      themeId: preference.themeId,
      mode: preference.mode,
      performanceMode: preference.performanceMode ?? false,
      setThemeId,
      setMode,
      setPerformanceMode,
      setPreference,
      availableThemes: getAvailableThemes(preference.performanceMode ?? false),
    }),
    [preference, setThemeId, setMode, setPerformanceMode, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return ctx;
}

export function useAnimationsEnabled() {
  const { performanceMode } = useTheme();
  return !performanceMode;
}
