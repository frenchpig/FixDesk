'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Text } from '@/components/atoms/Text';
import { SettingsMenu } from '@/components/organisms/SettingsMenu';
import { NotificationsMenu } from '@/components/organisms/NotificationsMenu';
import { Wrench } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-provider';

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header
      data-glass-surface
      className="relative z-40 border-b border-border bg-surface px-6 py-4 shadow-theme"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="text-primary" size={24} />
          <div>
            <Text as="h1" variant="h2" className="leading-tight">
              FixDesk
            </Text>
            {title && <Text variant="caption">{title}</Text>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationsMenu />
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: (pathname: string) => boolean;
}

export function NavLink({ href, children, isActive }: NavLinkProps) {
  const pathname = usePathname();
  const { themeId } = useTheme();
  const active = isActive
    ? isActive(pathname)
    : pathname === href || pathname.startsWith(`${href}/`);
  const isGlass = themeId === 'glassmorphism';

  return (
    <Link
      href={href}
      className={cn(
        'block rounded-theme px-3 py-2 text-sm transition-theme',
        active
          ? isGlass
            ? 'bg-primary-fill font-medium text-on-primary shadow-theme'
            : 'bg-primary/10 font-medium text-primary'
          : 'text-muted hover:bg-surface-secondary hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}
