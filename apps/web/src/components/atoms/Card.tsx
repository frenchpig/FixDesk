import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      data-glass-card
      className={cn(
        'rounded-theme border border-border p-[length:var(--spacing-theme)]',
        'bg-surface shadow-theme transition-theme',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
