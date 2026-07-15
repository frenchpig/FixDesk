export type ThemeId = 'minimal-professional' | 'github' | 'glassmorphism';

export type ColorMode = 'light' | 'dark';

export interface DesignTokens {
  background: string;
  surface: string;
  surfaceSecondary: string;
  primary: string;
  onPrimary: string;
  accent: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  warning: string;
  danger: string;
  onDanger: string;
  radius: string;
  shadow: string;
  spacing: string;
  transition: string;
  blur: string;
  /** Gradiente para botones/estados activos; si no aplica, igual que `primary` */
  primaryGradient: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  inspiration: string;
  light: DesignTokens;
  dark: DesignTokens;
}

export interface ThemePreference {
  themeId: ThemeId;
  mode: ColorMode;
  performanceMode?: boolean;
}

export const THEME_STORAGE_KEY = 'fixdesk-theme-preference';
