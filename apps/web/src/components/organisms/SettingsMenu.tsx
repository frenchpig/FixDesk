'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import { useAuth } from '@/lib/auth-context';
import { useAnimationsEnabled } from '@/lib/theme/theme-provider';
import { Settings, Palette, SlidersHorizontal, LogOut } from 'lucide-react';

const CLOSE_MS = 180;

export function SettingsMenu() {
  const { user, logout } = useAuth();
  const animationsEnabled = useAnimationsEnabled();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const closeMs = animationsEnabled ? CLOSE_MS : 0;

  const close = useCallback(() => {
    if (!animationsEnabled) {
      setOpen(false);
      setClosing(false);
      return;
    }
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, closeMs);
  }, [animationsEnabled, closeMs]);

  useEffect(() => {
    if (open) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de ruta
  }, [pathname]);

  useEffect(() => {
    if (!open || closing) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closing, close]);

  if (!user) return null;

  const isVisible = open || closing;

  return (
    <div ref={menuRef} className="relative z-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Configuración"
        className={cn(open && 'bg-surface-secondary')}
      >
        <Settings size={18} />
      </Button>

      {isVisible && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full z-[100] mt-2 w-56',
            'rounded-theme border border-border overlay-surface p-1 shadow-theme',
            animationsEnabled &&
              (closing ? 'animate-menu-panel-out' : 'animate-menu-panel-in'),
          )}
        >
          <AnimatedItem
            delay="menu-item-delay-1"
            animate={animationsEnabled}
            className="border-b border-border px-3 py-2.5"
          >
            <Text variant="body" className="font-medium truncate">
              {user.name}
            </Text>
            <Text variant="caption" className="truncate">
              {user.email}
            </Text>
          </AnimatedItem>

          <nav className="py-1">
            <AnimatedItem delay="menu-item-delay-2" animate={animationsEnabled}>
              <MenuLink
                href="/configuracion/apariencia"
                icon={<Palette size={16} />}
                onNavigate={close}
              >
                Apariencia
              </MenuLink>
            </AnimatedItem>
            <AnimatedItem delay="menu-item-delay-3" animate={animationsEnabled}>
              <MenuLink
                href="/configuracion"
                icon={<SlidersHorizontal size={16} />}
                onNavigate={close}
              >
                General
              </MenuLink>
            </AnimatedItem>
          </nav>

          <AnimatedItem
            delay="menu-item-delay-4"
            animate={animationsEnabled}
            className="border-t border-border py-1"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                logout();
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-theme px-3 py-2 text-sm transition-theme',
                'text-danger hover:bg-danger/10',
              )}
            >
              <LogOut size={16} />
              Salir
            </button>
          </AnimatedItem>
        </div>
      )}
    </div>
  );
}

function AnimatedItem({
  delay,
  animate,
  children,
  className,
}: {
  delay: `menu-item-delay-${0 | 1 | 2 | 3 | 4}`;
  animate?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(animate && 'animate-menu-item', animate && delay, className)}
    >
      {children}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2 rounded-theme px-3 py-2 text-sm transition-theme',
        'text-foreground hover:bg-surface-secondary',
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
