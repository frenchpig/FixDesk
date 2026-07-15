import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import { cn } from '@/lib/cn';

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface ReportsBarChartProps {
  title: string;
  items: BarItem[];
  emptyMessage?: string;
}

const DEFAULT_COLORS = [
  'bg-primary',
  'bg-success',
  'bg-warning',
  'bg-danger',
  'bg-muted',
];

export function ReportsBarChart({
  title,
  items,
  emptyMessage = 'Sin datos en el período',
}: ReportsBarChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <Card className="space-y-4">
      <Text variant="h3">{title}</Text>

      {!total ? (
        <Text variant="muted">{emptyMessage}</Text>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const pct = Math.round((item.value / total) * 100);
            const width = Math.max((item.value / max) * 100, 2);

            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.label}</span>
                  <span className="tabular-nums text-muted">
                    {item.value} ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                    )}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
