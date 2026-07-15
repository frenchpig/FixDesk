import type { DatePreset } from '@/types';

export function resolveDateRange(preset: DatePreset, dateFrom: string, dateTo: string) {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'last7':
      from.setDate(from.getDate() - 6);
      break;
    case 'last30':
      from.setDate(from.getDate() - 29);
      break;
    case 'last90':
      from.setDate(from.getDate() - 89);
      break;
    case 'thisMonth':
      from.setDate(1);
      break;
    case 'custom':
      return {
        dateFrom: dateFrom || from.toISOString().slice(0, 10),
        dateTo: dateTo || to.toISOString().slice(0, 10),
      };
  }

  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

export function formatHours(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value}%`;
}
