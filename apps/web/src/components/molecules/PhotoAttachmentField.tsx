// Responsabilidad: selector de imagen simulado (metadatos, sin leer bytes)
// Usado por: TicketForm
// NO hace: upload, preview de blob ni llamadas a API
'use client';

import { useId, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import { FormField } from '@/components/molecules/FormField';
import { validateSimulatedImageFile } from '@/lib/photo-placeholder';

interface PhotoAttachmentFieldProps {
  filename: string | null;
  error?: string;
  disabled?: boolean;
  onSelect: (file: File | null) => void;
  onError: (message: string) => void;
}

export function PhotoAttachmentField({
  filename,
  error,
  disabled = false,
  onSelect,
  onError,
}: PhotoAttachmentFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      onSelect(null);
      return;
    }

    const validationError = validateSimulatedImageFile(file);
    if (validationError) {
      onError(validationError);
      onSelect(null);
      e.target.value = '';
      return;
    }

    onError('');
    onSelect(file);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    onSelect(null);
    onError('');
  }

  return (
    <FormField
      label="Foto / captura (opcional)"
      htmlFor={inputId}
      error={error}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={16} />
          {filename ? 'Cambiar archivo' : 'Elegir imagen'}
        </Button>

        {filename && (
          <>
            <Text variant="caption" className="truncate max-w-[14rem]">
              {filename}
            </Text>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label="Quitar archivo"
              onClick={handleClear}
            >
              <X size={16} />
            </Button>
          </>
        )}
      </div>

      <Text variant="caption" className="mt-2 block">
        Simulado: no se sube la imagen (solo se guarda el nombre del archivo).
        JPG/PNG/WebP, máx. 5 MB.
      </Text>
    </FormField>
  );
}
