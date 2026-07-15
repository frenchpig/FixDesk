import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, hasError, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-theme border bg-surface px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted/70 backdrop-blur-theme transition-theme',
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        hasError ? 'border-danger' : 'border-border',
        className,
      )}
      {...props}
    />
  );
}
