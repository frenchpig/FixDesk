import { glassmorphismTheme } from './glassmorphism';
import { githubTheme } from './github';
import { minimalProfessionalTheme } from './minimal-professional';
import type {
  ColorMode,
  DesignTokens,
  ThemeDefinition,
  ThemeId,
  ThemePreference,
} from './types';
import { THEME_STORAGE_KEY } from './types';

export const themes: ThemeDefinition[] = [
  minimalProfessionalTheme,
  githubTheme,
  glassmorphismTheme,
];

export const GLASS_THEME_ID: ThemeId = 'glassmorphism';

export const defaultThemePreference: ThemePreference = {
  themeId: 'minimal-professional',
  mode: 'light',
  performanceMode: false,
};

export function getThemeById(id: ThemeId): ThemeDefinition {
  const theme = themes.find((t) => t.id === id);
  if (!theme) return minimalProfessionalTheme;
  return theme;
}

export function getThemeTokens(
  themeId: ThemeId,
  mode: ColorMode,
): DesignTokens {
  const theme = getThemeById(themeId);
  return theme[mode];
}

export function getAvailableThemes(performanceMode: boolean): ThemeDefinition[] {
  if (performanceMode) {
    return themes.filter((t) => t.id !== GLASS_THEME_ID);
  }
  return themes;
}

export function normalizePreference(preference: ThemePreference): ThemePreference {
  const performanceMode = preference.performanceMode ?? false;
  let themeId = preference.themeId;

  if (performanceMode && themeId === GLASS_THEME_ID) {
    themeId = 'minimal-professional';
  }

  return {
    themeId,
    mode: preference.mode,
    performanceMode,
  };
}

export function loadThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return defaultThemePreference;

  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return defaultThemePreference;
    const parsed = JSON.parse(raw) as ThemePreference;
    if (!themes.some((t) => t.id === parsed.themeId)) {
      return defaultThemePreference;
    }
    if (parsed.mode !== 'light' && parsed.mode !== 'dark') {
      return defaultThemePreference;
    }
    return normalizePreference(parsed);
  } catch {
    return defaultThemePreference;
  }
}

export function saveThemePreference(preference: ThemePreference) {
  localStorage.setItem(
    THEME_STORAGE_KEY,
    JSON.stringify(normalizePreference(preference)),
  );
}
