import { NavLink } from '@/components/organisms/AppHeader';
import { Text } from '@/components/atoms/Text';
import { LayoutDashboard, Ticket, PlusCircle, History, BarChart3 } from 'lucide-react';

export function Sidebar() {
  return (
    <aside
      data-glass-surface
      className="w-64 shrink-0 border-r border-border bg-surface p-4"
    >
      <Text variant="caption" className="mb-4 uppercase tracking-wider">
        Navegación
      </Text>
      <nav className="space-y-1">
        <NavLink
          href="/dashboard"
          isActive={(p) =>
            p === '/dashboard' || p.startsWith('/dashboard/tickets/')
          }
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard size={16} />
            Tablero
          </span>
        </NavLink>
        <NavLink
          href="/dashboard/historial"
          isActive={(p) => p.startsWith('/dashboard/historial')}
        >
          <span className="flex items-center gap-2">
            <History size={16} />
            Historial
          </span>
        </NavLink>
        <NavLink
          href="/dashboard/reportes"
          isActive={(p) => p.startsWith('/dashboard/reportes')}
        >
          <span className="flex items-center gap-2">
            <BarChart3 size={16} />
            Reportes
          </span>
        </NavLink>
        <NavLink href="/reportar">
          <span className="flex items-center gap-2">
            <PlusCircle size={16} />
            Nuevo reporte
          </span>
        </NavLink>
        <NavLink href="/mis-tickets">
          <span className="flex items-center gap-2">
            <Ticket size={16} />
            Mis tickets
          </span>
        </NavLink>
      </nav>
    </aside>
  );
}
