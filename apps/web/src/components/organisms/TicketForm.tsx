'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { Select } from '@/components/atoms/Select';
import { FormField } from '@/components/molecules/FormField';
import { PhotoAttachmentField } from '@/components/molecules/PhotoAttachmentField';
import { LabelPicker } from '@/components/molecules/LabelPicker';
import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  simulateUploadDelay,
  toPlaceholderPhotoUrl,
} from '@/lib/photo-placeholder';
import type { Ticket, TicketLabel } from '@/types';

const baseSchema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres').max(120),
  category: z.enum(['HARDWARE', 'NETWORK', 'INFRASTRUCTURE', 'ELECTRICAL']),
  location: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(2000),
});

const triageSchema = baseSchema.extend({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export function TicketForm() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [labels, setLabels] = useState<TicketLabel[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const canSetTriage =
    user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!token || !canSetTriage) return;
    api
      .get<{ data: TicketLabel[] }>('/labels', token)
      .then((res) => setLabels(res.data))
      .catch(() => setLabels([]));
  }, [token, canSetTriage]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const base = {
      title: form.get('title') as string,
      category: form.get('category') as string,
      location: form.get('location') as string,
      description: form.get('description') as string,
    };

    const data = canSetTriage
      ? {
          ...base,
          priority: (form.get('priority') as string) || 'MEDIUM',
          severity: (form.get('severity') as string) || 'MEDIUM',
        }
      : base;

    const result = (canSetTriage ? triageSchema : baseSchema).safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        await simulateUploadDelay();
        photoUrl = toPlaceholderPhotoUrl(photoFile.name);
      }

      const res = await api.post<{ data: Ticket }>(
        '/tickets',
        {
          ...result.data,
          ...(photoUrl ? { photoUrl } : {}),
          ...(canSetTriage && selectedLabelIds.length
            ? { labelIds: selectedLabelIds }
            : {}),
        },
        token ?? undefined,
      );

      const dest =
        canSetTriage
          ? `/dashboard/tickets/${res.data.id}`
          : `/mis-tickets/${res.data.id}`;
      router.push(dest);
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <Text variant="h2" className="mb-6">
        Reportar un problema
      </Text>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Título" htmlFor="title" error={errors.title}>
          <Input
            id="title"
            name="title"
            placeholder="Ej: Proyector no enciende"
            hasError={!!errors.title}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Categoría"
            htmlFor="category"
            error={errors.category}
          >
            <Select
              id="category"
              name="category"
              defaultValue="HARDWARE"
              hasError={!!errors.category}
            >
              <option value="HARDWARE">Hardware</option>
              <option value="NETWORK">Redes</option>
              <option value="INFRASTRUCTURE">Infraestructura</option>
              <option value="ELECTRICAL">Eléctrico</option>
            </Select>
          </FormField>

          {canSetTriage && (
            <>
              <FormField label="Prioridad" htmlFor="priority">
                <Select id="priority" name="priority" defaultValue="MEDIUM">
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                </Select>
              </FormField>

              <FormField
                label="Severidad (impacto)"
                htmlFor="severity"
                error={errors.severity}
              >
                <Select id="severity" name="severity" defaultValue="MEDIUM">
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </Select>
              </FormField>
            </>
          )}
        </div>

        {!canSetTriage && (
          <Text variant="caption" className="text-muted">
            La prioridad y severidad las asignará el equipo técnico al atender
            el ticket.
          </Text>
        )}

        <FormField label="Ubicación" htmlFor="location" error={errors.location}>
          <Input
            id="location"
            name="location"
            placeholder="Ej: Lab 3, Edificio B, Piso 2"
            hasError={!!errors.location}
          />
        </FormField>

        <FormField
          label="Descripción"
          htmlFor="description"
          error={errors.description}
        >
          <Textarea
            id="description"
            name="description"
            placeholder="Describe el problema con el mayor detalle posible"
            hasError={!!errors.description}
          />
        </FormField>

        {canSetTriage && (
          <div className="space-y-2">
            <Text variant="caption" className="font-medium text-foreground">
              Etiquetas (opcional)
            </Text>
            <LabelPicker
              options={labels}
              selectedIds={selectedLabelIds}
              onChange={setSelectedLabelIds}
              disabled={isLoading}
            />
          </div>
        )}

        <PhotoAttachmentField
          filename={photoFile?.name ?? null}
          error={errors.photo}
          disabled={isLoading}
          onSelect={setPhotoFile}
          onError={(message) =>
            setErrors((prev) => {
              if (!message) {
                const { photo: _, ...rest } = prev;
                return rest;
              }
              return { ...prev, photo: message };
            })
          }
        />

        {errors.form && (
          <Text variant="caption" className="text-danger">
            {errors.form}
          </Text>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
          Enviar reporte
        </Button>
      </form>
    </Card>
  );
}
