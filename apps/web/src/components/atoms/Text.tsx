import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'muted';

interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3';
  variant?: TextVariant;
}

const styles: Record<TextVariant, string> = {
  h1: 'text-2xl font-semibold text-foreground tracking-tight',
  h2: 'text-xl font-semibold text-foreground tracking-tight',
  h3: 'text-lg font-medium text-foreground',
  body: 'text-sm text-foreground',
  caption: 'text-xs text-muted',
  muted: 'text-sm text-muted',
};

export function Text({
  as: Tag = 'p',
  variant = 'body',
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Tag className={cn(styles[variant], className)} {...props}>
      {children}
    </Tag>
  );
}
