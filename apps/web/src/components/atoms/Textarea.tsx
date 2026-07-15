import { cn } from '@/lib/cn';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ className, hasError, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full rounded-theme border bg-surface px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted/70 min-h-24 resize-y backdrop-blur-theme transition-theme',
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        hasError ? 'border-danger' : 'border-border',
        className,
      )}
      {...props}
    />
  );
}
