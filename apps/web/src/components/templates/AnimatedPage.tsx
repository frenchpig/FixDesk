'use client';

import { cn } from '@/lib/cn';
import { useAnimationsEnabled } from '@/lib/theme/theme-provider';
import type { ReactNode } from 'react';

type SectionDelay = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const animationsEnabled = useAnimationsEnabled();

  return (
    <div className={cn(animationsEnabled && 'animate-page-in', className)}>
      {children}
    </div>
  );
}

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: SectionDelay;
}

const delayClass: Record<SectionDelay, string> = {
  1: 'page-section-delay-1',
  2: 'page-section-delay-2',
  3: 'page-section-delay-3',
  4: 'page-section-delay-4',
  5: 'page-section-delay-5',
  6: 'page-section-delay-6',
  7: 'page-section-delay-7',
  8: 'page-section-delay-8',
};

export function AnimatedSection({
  children,
  className,
  delay = 1,
}: AnimatedSectionProps) {
  const animationsEnabled = useAnimationsEnabled();

  return (
    <div
      className={cn(
        animationsEnabled && 'animate-page-section',
        animationsEnabled && delayClass[delay],
        className,
      )}
    >
      {children}
    </div>
  );
}
