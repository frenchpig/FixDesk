// Responsabilidad: editar campos principales de un ticket en un modal
// Usado por: dashboard/tickets/[id]
// NO hace: status, assign, labels ni adjuntos
'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Modal } from '@/components/atoms/Modal';
import { Select } from '@/components/atoms/Select';
import { Text } from '@/components/atoms/Text';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Ticket, TicketCategory, TicketPriority } from '@/types';

const schema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres').max(120),
  category: z.enum(['HARDWARE', 'NETWORK', 'INFRASTRUCTURE', 'ELECTRICAL']),
  location: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

interface TicketDetailsEditorProps {
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TicketDetailsEditor({
  ticket,
  open,
  onClose,
  onUpdate,
}: TicketDetailsEditorProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [category, setCategory] = useState<TicketCategory>(ticket.category);
  const [location, setLocation] = useState(ticket.location);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(ticket.title);
    setDescription(ticket.description);
    setCategory(ticket.category);
    setLocation(ticket.location);
    setPriority(ticket.priority);
    setErrors({});
  }, [open, ticket]);

  const dirty =
    title.trim() !== ticket.title ||
    description.trim() !== ticket.description ||
    category !== ticket.category ||
    location.trim() !== ticket.location ||
    priority !== ticket.priority;

  async function handleSave() {
    if (!token) return;
    setErrors({});

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      priority,
    };

    const result = schema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!dirty) return;

    setIsLoading(true);
    try {
      await api.patch(`/tickets/${ticket.id}`, result.data, token);
      onUpdate();
      onClose();
    } catch (err) {
      setErrors({ form: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    if (isLoading) return;
    onClose();
  }

  return (
    <Modal open={open} onClose={handleCancel} title="Editar ticket">
      <div className="space-y-4">
        <FormField label="Título" htmlFor="edit-title" error={errors.title}>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            hasError={!!errors.title}
            disabled={isLoading}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Categoría"
            htmlFor="edit-category"
            error={errors.category}
          >
            <Select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              hasError={!!errors.category}
              disabled={isLoading}
            >
              <option value="HARDWARE">Hardware</option>
              <option value="NETWORK">Redes</option>
              <option value="INFRASTRUCTURE">Infraestructura</option>
              <option value="ELECTRICAL">Eléctrico</option>
            </Select>
          </FormField>

          <FormField
            label="Prioridad"
            htmlFor="edit-priority"
            error={errors.priority}
          >
            <Select
              id="edit-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              hasError={!!errors.priority}
              disabled={isLoading}
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </Select>
          </FormField>
        </div>

        <FormField
          label="Ubicación"
          htmlFor="edit-location"
          error={errors.location}
        >
          <Input
            id="edit-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            hasError={!!errors.location}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Descripción"
          htmlFor="edit-description"
          error={errors.description}
        >
          <Textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            hasError={!!errors.description}
            disabled={isLoading}
          />
        </FormField>

        {errors.form && (
          <Text variant="caption" className="text-danger">
            {errors.form}
          </Text>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSave()}
            isLoading={isLoading}
            disabled={!dirty}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
}
