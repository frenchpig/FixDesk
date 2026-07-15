import type { ThemeDefinition } from './types';

const base = {
  spacing: '1.25rem',
  transition: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  onPrimary: '#FFFFFF',
  onDanger: '#FFFFFF',
};

export const glassmorphismTheme: ThemeDefinition = {
  id: 'glassmorphism',
  name: 'Glassmorphism',
  description: 'Interfaz premium con superficies de vidrio y acentos neón.',
  inspiration: 'Dashboard glass · UI premium',
  light: {
    ...base,
    background: '#E8EEF8',
    surface: 'rgba(255, 255, 255, 0.55)',
    surfaceSecondary: 'rgba(255, 255, 255, 0.35)',
    primary: '#4FACFE',
    primaryGradient: 'linear-gradient(135deg, #4FACFE 0%, #7C3AED 55%, #A18CD1 100%)',
    accent: '#8B5CF6',
    border: 'rgba(255, 255, 255, 0.45)',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    radius: '20px',
    shadow:
      '0 8px 32px rgba(79, 172, 254, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    blur: '20px',
  },
  dark: {
    ...base,
    background: '#0A0B1E',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceSecondary: 'rgba(255, 255, 255, 0.08)',
    primary: '#4FACFE',
    primaryGradient: 'linear-gradient(135deg, #4FACFE 0%, #7C3AED 50%, #A18CD1 100%)',
    accent: '#A18CD1',
    border: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0AEC0',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    radius: '20px',
    shadow:
      '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    blur: '20px',
  },
};
