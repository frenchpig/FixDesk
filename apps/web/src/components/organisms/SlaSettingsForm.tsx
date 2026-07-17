'use client';

// Responsabilidad: formulario para editar el umbral SLA del sistema
// Usado por: /configuracion/sla
// NO hace: apariencia ni otras settings

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Text } from '@/components/atoms/Text';
import { FormField } from '@/components/molecules/FormField';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Timer } from 'lucide-react';

interface SlaSettingsData {
  slaTargetHours: number;
  updatedAt: string | null;
  updatedById: string | null;
}

export function SlaSettingsForm() {
  const { token } = useAuth();
  const [hours, setHours] = useState('48');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    api
      .get<{ data: SlaSettingsData }>('/settings/sla', token)
      .then((res) => {
        setHours(String(res.data.slaTargetHours));
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const parsed = Number.parseInt(hours, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 720) {
      setError('Ingresa un entero entre 1 y 720 horas');
      setSuccess(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.patch<{ data: SlaSettingsData }>(
        '/settings/sla',
        { slaTargetHours: parsed },
        token,
      );
      setHours(String(res.data.slaTargetHours));
      setSuccess(
        `SLA actualizado a ${res.data.slaTargetHours} h. La reportería lo usará de inmediato.`,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Text variant="h2" className="mb-2">
          Objetivo SLA
        </Text>
        <Text variant="muted">
          Define cuántas horas máximas debe tardar la resolución de un ticket
          para considerarse dentro del SLA. El cambio aplica de inmediato a
          métricas y exports, sin reiniciar el servidor.
        </Text>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-primary" />
          <Text variant="h3">Umbral en horas</Text>
        </div>

        {isLoading ? (
          <Text variant="muted">Cargando configuración...</Text>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Horas objetivo" htmlFor="sla-hours">
              <Input
                id="sla-hours"
                type="number"
                min={1}
                max={720}
                step={1}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                aria-label="Horas objetivo SLA"
              />
            </FormField>
            <Text variant="caption" className="text-muted">
              Rango permitido: 1–720 horas (ej. 24, 48, 72).
            </Text>

            {error && (
              <Text variant="caption" className="text-danger">
                {error}
              </Text>
            )}
            {success && (
              <Text variant="caption" className="text-success">
                {success}
              </Text>
            )}

            <Button type="submit" isLoading={isSaving}>
              Guardar
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
