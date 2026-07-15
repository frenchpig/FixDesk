'use client';

import { cn } from '@/lib/cn';
import { Text } from '@/components/atoms/Text';
import { GlassPageBackgroundPreview } from '@/components/atoms/GlassPageBackground';
import { getThemeTokens } from '@/themes/registry';
import type { ColorMode, ThemeDefinition } from '@/themes/types';

interface ThemePreviewCardProps {
  theme: ThemeDefinition;
  mode: ColorMode;
  isSelected: boolean;
  onSelect: () => void;
}

function GlassThemePreview({ mode }: { mode: ColorMode }) {
  const tokens = getThemeTokens('glassmorphism', mode);

  return (
    <div
      data-theme="glassmorphism"
      data-mode={mode}
      className="relative min-h-[160px] overflow-hidden rounded-theme"
      style={{ color: tokens.textPrimary }}
    >
      <GlassPageBackgroundPreview mode={mode} />

      <div className="relative flex min-h-[160px] flex-col">
        <div
          data-glass-surface
          className="flex items-center gap-2 border-b px-3 py-2"
        >
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: tokens.primaryGradient ?? tokens.primary }}
          />
          <div
            className="h-1.5 w-16 rounded-full opacity-70"
            style={{ background: tokens.textPrimary }}
          />
        </div>

        <div className="flex flex-1">
          <div
            data-glass-surface
            className="w-14 shrink-0 border-r p-2"
          >
            <div
              className="mb-2 h-1.5 w-full rounded-full opacity-50"
              style={{ background: tokens.textSecondary }}
            />
            <div
              className="mb-1.5 h-4 w-full rounded-theme"
              style={{ background: tokens.primaryGradient ?? tokens.primary }}
            />
            <div
              className="h-4 w-full rounded-theme opacity-30"
              style={{ background: tokens.textSecondary }}
            />
          </div>

          <div className="flex-1 p-2.5">
            <div data-glass-card className="space-y-2 rounded-theme border p-2.5">
              <div
                className="h-1.5 w-3/4 rounded-full"
                style={{ background: tokens.textPrimary }}
              />
              <div
                className="h-1.5 w-1/2 rounded-full opacity-50"
                style={{ background: tokens.textSecondary }}
              />
              <div
                className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{
                  background: tokens.primaryGradient ?? tokens.primary,
                  color: tokens.onPrimary,
                }}
              >
                Badge
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemePreviewCard({
  theme,
  mode,
  isSelected,
  onSelect,
}: ThemePreviewCardProps) {
  const tokens = getThemeTokens(theme.id, mode);
  const isGlass = theme.id === 'glassmorphism';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-theme border p-4 text-left transition-theme',
        'focus:outline-none focus:ring-2 focus:ring-primary/40',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/40',
      )}
    >
      <div className="mb-4 overflow-hidden rounded-theme">
        {isGlass ? (
          <GlassThemePreview mode={mode} />
        ) : (
          <div className="p-4" style={{ background: tokens.background }}>
            <div className="mb-3 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  background: tokens.primaryGradient ?? tokens.primary,
                }}
              />
              <div
                className="h-2 w-20 rounded-full opacity-80"
                style={{ background: tokens.textPrimary }}
              />
            </div>
            <div
              className="space-y-2 rounded-[length:var(--preview-radius)] border p-3"
              style={{
                background: tokens.surface,
                borderColor: tokens.border,
                borderRadius: tokens.radius,
              }}
            >
              <div
                className="h-2 w-3/4 rounded-full"
                style={{ background: tokens.textPrimary }}
              />
              <div
                className="h-2 w-1/2 rounded-full opacity-60"
                style={{ background: tokens.textSecondary }}
              />
              <div
                className="mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-medium"
                style={{
                  background: tokens.primaryGradient ?? tokens.primary,
                  color: tokens.onPrimary,
                }}
              >
                Badge
              </div>
            </div>
          </div>
        )}
      </div>

      <Text variant="h3" className="mb-1">
        {theme.name}
      </Text>
      <Text variant="muted" className="mb-2">
        {theme.description}
      </Text>
      <Text variant="caption">{theme.inspiration}</Text>
    </button>
  );
}
