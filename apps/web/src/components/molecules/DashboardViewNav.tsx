'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme/theme-provider';
import { LayoutDashboard, History, BarChart3 } from 'lucide-react';

const VIEWS = [
  { href: '/dashboard', label: 'Kanban', icon: LayoutDashboard },
  { href: '/dashboard/historial', label: 'Historial', icon: History },
  { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart3 },
] as const;

export function DashboardViewNav() {
  const pathname = usePathname();
  const { themeId } = useTheme();
  const isGlass = themeId === 'glassmorphism';

  return (
    <nav
      data-glass-card
      className="flex gap-1 rounded-theme border border-border bg-surface p-1 shadow-theme transition-theme"
    >
      {VIEWS.map(({ href, label, icon: Icon }) => {
        const active =
          href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-theme px-4 py-2 text-sm transition-theme',
              active
                ? isGlass
                  ? 'bg-primary-fill font-medium text-on-primary shadow-theme'
                  : 'bg-primary/10 font-medium text-primary'
                : 'text-muted hover:bg-surface-secondary hover:text-foreground',
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
