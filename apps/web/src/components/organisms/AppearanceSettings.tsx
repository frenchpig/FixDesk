'use client';

import { Text } from '@/components/atoms/Text';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Switch } from '@/components/atoms/Switch';
import { ThemePreviewCard } from '@/components/molecules/ThemePreviewCard';
import { useTheme } from '@/lib/theme/theme-provider';
import type { ColorMode, ThemeId } from '@/themes/types';
import { Moon, Sun, Gauge } from 'lucide-react';

export function AppearanceSettings() {
  const {
    themeId,
    mode,
    performanceMode,
    setThemeId,
    setMode,
    setPerformanceMode,
    availableThemes,
  } = useTheme();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Text variant="h2" className="mb-2">
          Apariencia
        </Text>
        <Text variant="muted">
          Personaliza el aspecto visual de FixDesk. Los cambios se aplican al
          instante y se guardan automáticamente.
        </Text>
      </div>

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gauge size={18} className="text-primary" />
              <Text variant="h3">Modo rendimiento</Text>
            </div>
            <Text variant="muted">
              Desactiva todas las animaciones y el tema Glassmorphism para
              mejorar el rendimiento en equipos modestos.
            </Text>
          </div>
          <Switch
            id="performance-mode"
            checked={performanceMode}
            onChange={setPerformanceMode}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <Text variant="h3">Modo de color</Text>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['light', 'Claro', Sun],
              ['dark', 'Oscuro', Moon],
            ] as const
          ).map(([value, label, Icon]) => (
            <Button
              key={value}
              size="sm"
              variant={mode === value ? 'primary' : 'secondary'}
              onClick={() => setMode(value as ColorMode)}
            >
              <Icon size={16} />
              {label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Text variant="h3">Tema</Text>
        {performanceMode && (
          <Text variant="caption">
            Glassmorphism no está disponible en modo rendimiento.
          </Text>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableThemes.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              mode={mode}
              isSelected={themeId === theme.id}
              onSelect={() => setThemeId(theme.id as ThemeId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
