import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/atoms/Table';
import { Pagination } from '@/components/molecules/Pagination';
import { TicketTableRow } from '@/components/molecules/TicketTableRow';
import type { PaginatedMeta, Ticket } from '@/types';

interface TicketTableProps {
  tickets: Ticket[];
  meta: PaginatedMeta;
  onPageChange: (page: number) => void;
  basePath?: string;
}

export function TicketTable({
  tickets,
  meta,
  onPageChange,
  basePath,
}: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <Text variant="muted">No se encontraron tickets con los filtros aplicados.</Text>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Reportado por</TableHead>
              <TableHead>Asignado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Resuelto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TicketTableRow
                key={ticket.id}
                ticket={ticket}
                basePath={basePath}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination meta={meta} onPageChange={onPageChange} />
    </Card>
  );
}
