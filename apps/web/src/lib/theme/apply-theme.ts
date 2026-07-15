import type { ColorMode, DesignTokens, ThemeId } from '@/themes/types';

const TOKEN_CSS_MAP: Record<keyof DesignTokens, string> = {
  background: '--token-background',
  surface: '--token-surface',
  surfaceSecondary: '--token-surface-secondary',
  primary: '--token-primary',
  onPrimary: '--token-on-primary',
  accent: '--token-accent',
  border: '--token-border',
  textPrimary: '--token-text-primary',
  textSecondary: '--token-text-secondary',
  success: '--token-success',
  warning: '--token-warning',
  danger: '--token-danger',
  onDanger: '--token-on-danger',
  radius: '--token-radius',
  shadow: '--token-shadow',
  spacing: '--token-spacing',
  transition: '--token-transition',
  blur: '--token-blur',
  primaryGradient: '--token-primary-gradient',
};

export function applyPerformanceMode(enabled: boolean) {
  document.documentElement.setAttribute(
    'data-performance-mode',
    enabled ? 'true' : 'false',
  );
}

export function applyDesignTokens(
  tokens: DesignTokens,
  themeId: ThemeId,
  mode: ColorMode,
  performanceMode = false,
) {
  const root = document.documentElement;

  root.setAttribute('data-theme', themeId);
  root.setAttribute('data-mode', mode);
  root.style.colorScheme = mode;
  applyPerformanceMode(performanceMode);

  for (const [key, cssVar] of Object.entries(TOKEN_CSS_MAP)) {
    root.style.setProperty(cssVar, tokens[key as keyof DesignTokens]);
  }
}
