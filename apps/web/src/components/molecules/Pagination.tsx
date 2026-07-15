import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedMeta } from '@/types';

interface PaginationProps {
  meta: PaginatedMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = meta;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
      <Text variant="caption">
        {total} ticket{total !== 1 ? 's' : ''} en total
      </Text>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
          Anterior
        </Button>

        <Text variant="caption">
          Página {page} de {totalPages}
        </Text>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
