// Responsabilidad: formulario controlado para escribir una nota/comentario
// Usado por: TicketComments
// NO hace: llamadas a la API ni lógica de ticket
import { Button } from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import { FormField } from '@/components/molecules/FormField';

interface CommentFormProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
}

export function CommentForm({
  id = 'comment',
  value,
  onChange,
  onSubmit,
  isLoading = false,
  error,
  disabled = false,
  label = 'Nuevo comentario',
  placeholder = 'Escribe una nota técnica...',
  submitLabel = 'Publicar',
}: CommentFormProps) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <FormField label={label} htmlFor={id} error={error}>
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          hasError={Boolean(error)}
          maxLength={1000}
        />
      </FormField>
      <Button
        type="submit"
        size="sm"
        isLoading={isLoading}
        disabled={disabled || !value.trim()}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
