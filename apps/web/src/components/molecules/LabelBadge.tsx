// Responsabilidad: chip visual de una etiqueta de ticket
// Usado por: LabelPicker, TicketCard, detalle, TicketTableRow
// NO hace: llamadas a API
import { cn } from '@/lib/cn';

interface LabelBadgeProps {
  name: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LabelBadge({
  name,
  color,
  selected,
  onClick,
  className,
}: LabelBadgeProps) {
  const Comp = onClick ? 'button' : 'span';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-theme border px-2 py-0.5 text-xs font-medium transition-theme',
        onClick && 'cursor-pointer hover:opacity-90',
        selected ? 'border-primary ring-1 ring-primary/40' : 'border-border',
        className,
      )}
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {name}
    </Comp>
  );
}
