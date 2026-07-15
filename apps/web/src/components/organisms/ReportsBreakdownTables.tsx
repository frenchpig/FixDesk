import { Card } from '@/components/atoms/Card';
import { Text } from '@/components/atoms/Text';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/Table';
import { formatHours } from '@/lib/report-utils';
import type { ReportReporterItem, ReportTechnicianItem } from '@/types';

interface ReportsTechnicianTableProps {
  items: ReportTechnicianItem[];
}

export function ReportsTechnicianTable({ items }: ReportsTechnicianTableProps) {
  return (
    <Card className="space-y-4">
      <Text variant="h3">Rendimiento por técnico</Text>
      {!items.length ? (
        <Text variant="muted">Sin asignaciones en el período</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Técnico</TableHead>
              <TableHead className="text-right">Asignados</TableHead>
              <TableHead className="text-right">Resueltos</TableHead>
              <TableHead className="text-right">T. medio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>{row.userName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.assigned}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.resolved}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatHours(row.avgResolutionHours)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

interface ReportsReporterTableProps {
  items: ReportReporterItem[];
}

export function ReportsReporterTable({ items }: ReportsReporterTableProps) {
  return (
    <Card className="space-y-4">
      <Text variant="h3">Reportes por persona</Text>
      {!items.length ? (
        <Text variant="muted">Sin reportes en el período</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona</TableHead>
              <TableHead className="text-right">Tickets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>{row.userName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
