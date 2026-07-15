'use client';

import { NavLink } from '@/components/organisms/AppHeader';
import { Text } from '@/components/atoms/Text';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/types';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  History,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  isActive?: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tablero',
    icon: LayoutDashboard,
    roles: ['TECHNICIAN', 'ADMIN'],
    isActive: (p) =>
      p === '/dashboard' || p.startsWith('/dashboard/tickets/'),
  },
  {
    href: '/dashboard/historial',
    label: 'Historial',
    icon: History,
    roles: ['TECHNICIAN', 'ADMIN'],
    isActive: (p) => p.startsWith('/dashboard/historial'),
  },
  {
    href: '/dashboard/reportes',
    label: 'Reportes',
    icon: BarChart3,
    roles: ['TECHNICIAN', 'ADMIN'],
    isActive: (p) => p.startsWith('/dashboard/reportes'),
  },
  {
    href: '/mis-tickets',
    label: 'Mis tickets',
    icon: Ticket,
    roles: ['USER'],
    isActive: (p) =>
      p === '/mis-tickets' || p.startsWith('/mis-tickets/'),
  },
  {
    href: '/reportar',
    label: 'Nuevo reporte',
    icon: PlusCircle,
    roles: ['USER', 'TECHNICIAN', 'ADMIN'],
    isActive: (p) => p === '/reportar',
  },
];

export function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      data-glass-surface
      className="w-64 shrink-0 border-r border-border bg-surface p-4"
    >
      <Text variant="caption" className="mb-4 uppercase tracking-wider">
        Navegación
      </Text>
      <nav className="space-y-1">
        {items.map(({ href, label, icon: Icon, isActive }) => (
          <NavLink key={href} href={href} isActive={isActive}>
            <span className="flex items-center gap-2">
              <Icon size={16} />
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
