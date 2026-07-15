import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import type { ReportTrendPoint } from '@/types';

interface ReportsTrendChartProps {
  title: string;
  data: ReportTrendPoint[];
}

export function ReportsTrendChart({ title, data }: ReportsTrendChartProps) {
  const width = 640;
  const height = 220;
  const padX = 36;
  const padY = 24;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const maxY = Math.max(
    ...data.flatMap((d) => [d.created, d.resolved]),
    1,
  );

  function toPoint(
    index: number,
    value: number,
    total: number,
  ): { x: number; y: number } {
    const x = padX + (index / Math.max(total - 1, 1)) * chartW;
    const y = padY + chartH - (value / maxY) * chartH;
    return { x, y };
  }

  function buildPath(key: 'created' | 'resolved'): string {
    if (!data.length) return '';
    return data
      .map((d, i) => {
        const { x, y } = toPoint(i, d[key], data.length);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  const showLabels = data.length <= 14;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text variant="h3">{title}</Text>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-4 rounded bg-primary" />
            Creados
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-4 rounded bg-success" />
            Resueltos
          </span>
        </div>
      </div>

      {!data.length ? (
        <Text variant="muted">Sin actividad en el período</Text>
      ) : (
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="min-w-full"
            role="img"
            aria-label={title}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padY + chartH - ratio * chartH;
              const label = Math.round(maxY * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={width - padX}
                    y2={y}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padX - 6}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted text-[10px]"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            <path
              d={buildPath('created')}
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth={2}
            />
            <path
              d={buildPath('resolved')}
              fill="none"
              stroke="currentColor"
              className="text-success"
              strokeWidth={2}
            />

            {showLabels &&
              data.map((d, i) => {
                const { x } = toPoint(i, 0, data.length);
                const label = d.date.slice(5);
                return (
                  <text
                    key={d.date}
                    x={x}
                    y={height - 4}
                    textAnchor="middle"
                    className="fill-muted text-[9px]"
                  >
                    {label}
                  </text>
                );
              })}
          </svg>
        </div>
      )}
    </Card>
  );
}
