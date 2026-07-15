// Responsabilidad: selección múltiple de etiquetas desde el catálogo
// Usado por: TicketForm, TicketLabelsEditor
// NO hace: crear etiquetas nuevas ni llamadas a API
'use client';

import { Text } from '@/components/atoms/Text';
import { LabelBadge } from '@/components/molecules/LabelBadge';
import type { TicketLabel } from '@/types';

interface LabelPickerProps {
  options: TicketLabel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
}

export function LabelPicker({
  options,
  selectedIds,
  onChange,
  disabled = false,
  emptyMessage = 'No hay etiquetas disponibles.',
}: LabelPickerProps) {
  function toggle(id: string) {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (!options.length) {
    return <Text variant="muted">{emptyMessage}</Text>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((label) => (
        <LabelBadge
          key={label.id}
          name={label.name}
          color={label.color}
          selected={selectedIds.includes(label.id)}
          onClick={disabled ? undefined : () => toggle(label.id)}
        />
      ))}
    </div>
  );
}
