import { Label } from '@/components/atoms/Label';
import { Text } from '@/components/atoms/Text';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      )}
    </div>
  );
}
