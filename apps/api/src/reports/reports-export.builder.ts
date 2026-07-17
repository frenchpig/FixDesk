// Responsabilidad: convertir métricas de reportes a Excel (.xlsx) y PDF con diseño de marca
// Usado por: ReportsService (exportExcel / exportPdf)
// NO hace: consultar DB ni aplicar filtros

import { existsSync } from 'node:fs';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {
  TicketCategory,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
} from '@prisma/client';
import { STATUS_LABELS } from '../tickets/ticket-transitions';

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: 'Hardware',
  NETWORK: 'Redes',
  INFRASTRUCTURE: 'Infraestructura',
  ELECTRICAL: 'Eléctrico',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

const SEVERITY_LABELS: Record<TicketSeverity, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const DEJAVU_REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const DEJAVU_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

/** Paleta FixDesk para exports (legible en print + Excel) */
const BRAND = {
  primary: '0B4F6C',
  accent: '14919B',
  soft: 'E6F4F5',
  surface: 'F8FAFC',
  zebra: 'F1F5F9',
  text: '0F172A',
  muted: '64748B',
  white: 'FFFFFF',
  success: '059669',
  warning: 'D97706',
  danger: 'DC2626',
  border: 'CBD5E1',
};

export type ReportsExportData = {
  period: { from: string; to: string };
  kpis: {
    created: number;
    resolved: number;
    cancelled: number;
    openBacklog: number;
    inProgress: number;
    pending: number;
    highPriorityOpen: number;
    criticalSeverityOpen: number;
    resolutionRate: number;
    cancellationRate: number;
    avgResolutionHours: number | null;
    avgFirstResponseHours: number | null;
    slaComplianceRate: number | null;
    slaTargetHours: number;
  };
  byStatus: { status: TicketStatus; count: number }[];
  byCategory: { category: TicketCategory; count: number }[];
  byPriority: { priority: TicketPriority; count: number }[];
  bySeverity: { severity: TicketSeverity; count: number }[];
  byArea: { areaId: string | null; areaName: string; count: number }[];
  byTechnician: {
    userId: string;
    userName: string;
    assigned: number;
    resolved: number;
    avgResolutionHours: number | null;
  }[];
  byReporter: { userId: string; userName: string; count: number }[];
  trends: { date: string; created: number; resolved: number }[];
};

function formatDateEs(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatHours(value: number | null): string {
  return value === null ? '—' : `${value}`;
}

function periodLabel(data: ReportsExportData): string {
  return `${formatDateEs(data.period.from)} — ${formatDateEs(data.period.to)}`;
}

function kpiRows(data: ReportsExportData): Array<{
  label: string;
  value: string | number;
  tone?: 'success' | 'warning' | 'danger' | 'accent';
}> {
  const { kpis } = data;
  return [
    { label: 'Tickets creados', value: kpis.created, tone: 'accent' },
    { label: 'Tickets resueltos', value: kpis.resolved, tone: 'success' },
    { label: 'Tickets cancelados', value: kpis.cancelled, tone: 'danger' },
    { label: 'Backlog abierto', value: kpis.openBacklog },
    { label: 'En progreso', value: kpis.inProgress },
    { label: 'Pendientes', value: kpis.pending, tone: 'warning' },
    { label: 'Alta prioridad abiertos', value: kpis.highPriorityOpen, tone: 'danger' },
    {
      label: 'Severidad crítica abiertos',
      value: kpis.criticalSeverityOpen,
      tone: 'danger',
    },
    { label: 'Tasa de resolución', value: `${kpis.resolutionRate}%`, tone: 'success' },
    { label: 'Tasa de cancelación', value: `${kpis.cancellationRate}%` },
    {
      label: 'Prom. resolución (h)',
      value: formatHours(kpis.avgResolutionHours),
    },
    {
      label: 'Prom. 1ª respuesta (h)',
      value: formatHours(kpis.avgFirstResponseHours),
    },
    {
      label: `SLA ${kpis.slaTargetHours}h cumplido`,
      value:
        kpis.slaComplianceRate === null ? '—' : `${kpis.slaComplianceRate}%`,
      tone: 'accent',
    },
  ];
}

function toneHex(tone?: 'success' | 'warning' | 'danger' | 'accent'): string {
  switch (tone) {
    case 'success':
      return BRAND.success;
    case 'warning':
      return BRAND.warning;
    case 'danger':
      return BRAND.danger;
    case 'accent':
      return BRAND.accent;
    default:
      return BRAND.primary;
  }
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = {
    style: 'thin',
    color: { argb: `FF${BRAND.border}` },
  };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

function styleHeaderRow(row: ExcelJS.Row, colCount: number) {
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${BRAND.primary}` },
    };
    cell.font = { bold: true, color: { argb: `FF${BRAND.white}` }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = thinBorder();
  }
  row.height = 22;
}

function styleDataRow(row: ExcelJS.Row, colCount: number, zebra: boolean) {
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    if (zebra) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${BRAND.zebra}` },
      };
    }
    cell.font = { color: { argb: `FF${BRAND.text}` }, size: 10 };
    cell.border = thinBorder();
    cell.alignment = { vertical: 'middle' };
  }
}

/**
 * Workbook Excel (.xlsx) con varias hojas, colores de marca y tablas formateadas.
 */
export async function buildReportsExcel(
  data: ReportsExportData,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FixDesk';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.company = 'FixDesk';

  const resumen = workbook.addWorksheet('Resumen', {
    properties: { tabColor: { argb: `FF${BRAND.accent}` } },
    views: [{ state: 'frozen', ySplit: 6 }],
  });

  resumen.mergeCells('A1:D1');
  resumen.getCell('A1').value = 'FixDesk';
  resumen.getCell('A1').font = {
    bold: true,
    size: 22,
    color: { argb: `FF${BRAND.primary}` },
  };
  resumen.getCell('A1').alignment = { vertical: 'middle' };
  resumen.getRow(1).height = 32;

  resumen.mergeCells('A2:D2');
  resumen.getCell('A2').value = 'Reporte operativo de métricas';
  resumen.getCell('A2').font = {
    size: 14,
    color: { argb: `FF${BRAND.text}` },
  };

  resumen.mergeCells('A3:D3');
  resumen.getCell('A3').value = `Período: ${periodLabel(data)}`;
  resumen.getCell('A3').font = {
    size: 11,
    color: { argb: `FF${BRAND.muted}` },
  };

  resumen.mergeCells('A4:D4');
  resumen.getCell('A4').value =
    `Generado: ${new Date().toLocaleString('es-CL')}`;
  resumen.getCell('A4').font = {
    size: 9,
    color: { argb: `FF${BRAND.muted}` },
    italic: true,
  };

  resumen.getCell('A6').value = 'Indicadores clave';
  resumen.getCell('A6').font = {
    bold: true,
    size: 13,
    color: { argb: `FF${BRAND.primary}` },
  };

  const headerKpi = resumen.getRow(7);
  headerKpi.values = ['Indicador', 'Valor', '', ''];
  styleHeaderRow(headerKpi, 2);

  const kpis = kpiRows(data);
  kpis.forEach((kpi, i) => {
    const row = resumen.getRow(8 + i);
    row.values = [kpi.label, kpi.value];
    styleDataRow(row, 2, i % 2 === 1);
    row.getCell(2).font = {
      bold: true,
      size: 12,
      color: { argb: `FF${toneHex(kpi.tone)}` },
    };
    row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    row.height = 20;
  });

  resumen.getColumn(1).width = 32;
  resumen.getColumn(2).width = 16;
  resumen.getColumn(3).width = 14;
  resumen.getColumn(4).width = 14;

  addBreakdownSheet(workbook, data);
  addTeamSheet(workbook, data);
  addTrendsSheet(workbook, data);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function addBreakdownSheet(workbook: ExcelJS.Workbook, data: ReportsExportData) {
  const sheet = workbook.addWorksheet('Desgloses', {
    properties: { tabColor: { argb: `FF${BRAND.primary}` } },
  });

  sheet.getCell('A1').value = 'Desgloses del período';
  sheet.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: `FF${BRAND.primary}` },
  };
  sheet.getCell('A2').value = periodLabel(data);
  sheet.getCell('A2').font = { size: 10, color: { argb: `FF${BRAND.muted}` } };

  let col = 1;
  col = writeNamedCountTable(
    sheet,
    col,
    4,
    'Por estado',
    data.byStatus.map((r) => ({
      name: STATUS_LABELS[r.status] ?? r.status,
      count: r.count,
    })),
  );
  col = writeNamedCountTable(
    sheet,
    col,
    4,
    'Por categoría',
    data.byCategory.map((r) => ({
      name: CATEGORY_LABELS[r.category] ?? r.category,
      count: r.count,
    })),
  );
  col = writeNamedCountTable(
    sheet,
    col,
    4,
    'Por prioridad',
    data.byPriority.map((r) => ({
      name: PRIORITY_LABELS[r.priority] ?? r.priority,
      count: r.count,
    })),
  );
  col = writeNamedCountTable(
    sheet,
    col,
    4,
    'Por severidad',
    data.bySeverity.map((r) => ({
      name: SEVERITY_LABELS[r.severity] ?? r.severity,
      count: r.count,
    })),
  );
  writeNamedCountTable(
    sheet,
    col,
    4,
    'Por área',
    data.byArea.map((r) => ({ name: r.areaName, count: r.count })),
  );

  sheet.columns.forEach((c) => {
    if (!c.width) c.width = 16;
  });
}

function writeNamedCountTable(
  sheet: ExcelJS.Worksheet,
  startCol: number,
  startRow: number,
  title: string,
  rows: { name: string; count: number }[],
): number {
  const titleCell = sheet.getCell(startRow, startCol);
  titleCell.value = title;
  titleCell.font = {
    bold: true,
    size: 12,
    color: { argb: `FF${BRAND.accent}` },
  };

  const header = sheet.getRow(startRow + 1);
  header.getCell(startCol).value = 'Nombre';
  header.getCell(startCol + 1).value = 'Cantidad';
  for (let c = startCol; c <= startCol + 1; c++) {
    const cell = header.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${BRAND.primary}` },
    };
    cell.font = { bold: true, color: { argb: `FF${BRAND.white}` }, size: 10 };
    cell.border = thinBorder();
  }

  rows.forEach((r, i) => {
    const row = sheet.getRow(startRow + 2 + i);
    row.getCell(startCol).value = r.name;
    row.getCell(startCol + 1).value = r.count;
    for (let c = startCol; c <= startCol + 1; c++) {
      const cell = row.getCell(c);
      if (i % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: `FF${BRAND.zebra}` },
        };
      }
      cell.border = thinBorder();
      cell.font = { size: 10, color: { argb: `FF${BRAND.text}` } };
    }
    row.getCell(startCol + 1).alignment = {
      horizontal: 'right',
      vertical: 'middle',
    };
  });

  sheet.getColumn(startCol).width = 18;
  sheet.getColumn(startCol + 1).width = 12;
  return startCol + 3;
}

function addTeamSheet(workbook: ExcelJS.Workbook, data: ReportsExportData) {
  const sheet = workbook.addWorksheet('Equipo', {
    properties: { tabColor: { argb: `FF${BRAND.success}` } },
  });

  sheet.getCell('A1').value = 'Desempeño del equipo';
  sheet.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: `FF${BRAND.primary}` },
  };
  sheet.getCell('A2').value = periodLabel(data);
  sheet.getCell('A2').font = { size: 10, color: { argb: `FF${BRAND.muted}` } };

  sheet.getCell('A4').value = 'Técnicos';
  sheet.getCell('A4').font = {
    bold: true,
    size: 12,
    color: { argb: `FF${BRAND.accent}` },
  };

  const techHeader = sheet.getRow(5);
  techHeader.values = [
    'Técnico',
    'Asignados',
    'Resueltos',
    'Prom. resolución (h)',
  ];
  styleHeaderRow(techHeader, 4);

  data.byTechnician.forEach((r, i) => {
    const row = sheet.getRow(6 + i);
    row.values = [
      r.userName,
      r.assigned,
      r.resolved,
      r.avgResolutionHours ?? '—',
    ];
    styleDataRow(row, 4, i % 2 === 1);
    row.getCell(2).alignment = { horizontal: 'right' };
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(4).alignment = { horizontal: 'right' };
  });

  const reporterStart = 8 + data.byTechnician.length;
  sheet.getCell(`A${reporterStart}`).value = 'Reportantes';
  sheet.getCell(`A${reporterStart}`).font = {
    bold: true,
    size: 12,
    color: { argb: `FF${BRAND.accent}` },
  };

  const repHeader = sheet.getRow(reporterStart + 1);
  repHeader.values = ['Reportante', 'Tickets creados'];
  styleHeaderRow(repHeader, 2);

  data.byReporter.forEach((r, i) => {
    const row = sheet.getRow(reporterStart + 2 + i);
    row.values = [r.userName, r.count];
    styleDataRow(row, 2, i % 2 === 1);
    row.getCell(2).alignment = { horizontal: 'right' };
  });

  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 14;
  sheet.getColumn(4).width = 22;
}

function addTrendsSheet(workbook: ExcelJS.Workbook, data: ReportsExportData) {
  const sheet = workbook.addWorksheet('Tendencia', {
    properties: { tabColor: { argb: `FF${BRAND.warning}` } },
  });

  sheet.getCell('A1').value = 'Tendencia diaria';
  sheet.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: `FF${BRAND.primary}` },
  };
  sheet.getCell('A2').value = periodLabel(data);
  sheet.getCell('A2').font = { size: 10, color: { argb: `FF${BRAND.muted}` } };

  const header = sheet.getRow(4);
  header.values = ['Fecha', 'Creados', 'Resueltos', 'Balance (R−C)'];
  styleHeaderRow(header, 4);

  data.trends.forEach((r, i) => {
    const row = sheet.getRow(5 + i);
    const balance = r.resolved - r.created;
    row.values = [r.date, r.created, r.resolved, balance];
    styleDataRow(row, 4, i % 2 === 1);
    row.getCell(2).alignment = { horizontal: 'right' };
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(4).font = {
      bold: true,
      size: 10,
      color: {
        argb: `FF${balance >= 0 ? BRAND.success : BRAND.danger}`,
      },
    };
  });

  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 16;

  if (data.trends.length > 0) {
    const chartNote = sheet.getCell(5 + data.trends.length + 1, 1);
    chartNote.value =
      'Tip: selecciones Fecha / Creados / Resueltos e inserten un gráfico de líneas en Excel.';
    chartNote.font = {
      italic: true,
      size: 9,
      color: { argb: `FF${BRAND.muted}` },
    };
  }
}

function asciiFallback(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/—/g, '-');
}

type PdfFonts = {
  regular: string;
  bold: string;
  t: (text: string) => string;
};

function resolvePdfFonts(): PdfFonts {
  const useUnicode =
    existsSync(DEJAVU_REGULAR) && existsSync(DEJAVU_BOLD);
  return {
    regular: useUnicode ? 'Regular' : 'Helvetica',
    bold: useUnicode ? 'Bold' : 'Helvetica-Bold',
    t: (text) => (useUnicode ? text : asciiFallback(text)),
  };
}

/**
 * PDF con cabecera de marca, tarjetas KPI, tablas y barras de distribución.
 */
export async function buildReportsPdf(
  data: ReportsExportData,
): Promise<Buffer> {
  const fonts = resolvePdfFonts();
  const doc = new PDFDocument({
    margin: 0,
    size: 'A4',
    bufferPages: true,
    info: {
      Title: 'FixDesk — Reporte de métricas',
      Author: 'FixDesk',
      Subject: periodLabel(data),
      Creator: 'FixDesk Reports',
    },
  });

  if (fonts.regular === 'Regular') {
    doc.registerFont('Regular', DEJAVU_REGULAR);
    doc.registerFont('Bold', DEJAVU_BOLD);
  }

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const marginX = 40;
  const contentW = pageW - marginX * 2;
  let y = 0;

  // —— Header band ——
  doc.rect(0, 0, pageW, 88).fill(`#${BRAND.primary}`);
  doc
    .rect(0, 88, pageW, 4)
    .fill(`#${BRAND.accent}`);

  doc
    .fillColor('#FFFFFF')
    .font(fonts.bold)
    .fontSize(22)
    .text(fonts.t('FixDesk'), marginX, 22, { width: contentW });

  doc
    .font(fonts.regular)
    .fontSize(11)
    .fillColor('#D1E8ED')
    .text(fonts.t('Reporte operativo de métricas'), marginX, 48, {
      width: contentW,
    });

  doc
    .fontSize(9)
    .fillColor('#A8CED6')
    .text(fonts.t(`Período: ${periodLabel(data)}`), marginX, 66, {
      width: contentW * 0.65,
    });

  doc.text(
    fonts.t(
      new Date().toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    ),
    marginX,
    66,
    { width: contentW, align: 'right' },
  );

  y = 112;

  // —— KPI cards ——
  doc
    .fillColor(`#${BRAND.primary}`)
    .font(fonts.bold)
    .fontSize(13)
    .text(fonts.t('Indicadores clave'), marginX, y, { width: contentW });
  y += 22;

  const cards = kpiRows(data).slice(0, 8);
  const cols = 4;
  const gap = 10;
  const cardW = (contentW - gap * (cols - 1)) / cols;
  const cardH = 52;

  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = marginX + col * (cardW + gap);
    const cy = y + row * (cardH + gap);

    doc
      .roundedRect(x, cy, cardW, cardH, 6)
      .fill(`#${BRAND.surface}`);
    doc
      .roundedRect(x, cy, 4, cardH, 2)
      .fill(`#${toneHex(card.tone)}`);

    doc
      .fillColor(`#${BRAND.muted}`)
      .font(fonts.regular)
      .fontSize(8)
      .text(fonts.t(card.label), x + 12, cy + 10, {
        width: cardW - 18,
        height: 14,
        ellipsis: true,
      });

    doc
      .fillColor(`#${toneHex(card.tone)}`)
      .font(fonts.bold)
      .fontSize(16)
      .text(String(card.value), x + 12, cy + 26, {
        width: cardW - 18,
      });
  });

  y += Math.ceil(cards.length / cols) * (cardH + gap) + 8;

  // Remaining KPIs as compact row
  const rest = kpiRows(data).slice(8);
  if (rest.length) {
    doc
      .fillColor(`#${BRAND.muted}`)
      .font(fonts.regular)
      .fontSize(9);
    const restLine = rest
      .map((r) => `${r.label}: ${r.value}`)
      .join('   ·   ');
    doc.text(fonts.t(restLine), marginX, y, { width: contentW });
    y += 22;
  }

  y = drawSectionTitle(doc, fonts, marginX, y, contentW, 'Distribución');

  const distributions: Array<{
    title: string;
    items: { label: string; count: number }[];
  }> = [
    {
      title: 'Estado',
      items: data.byStatus.map((r) => ({
        label: STATUS_LABELS[r.status] ?? r.status,
        count: r.count,
      })),
    },
    {
      title: 'Categoría',
      items: data.byCategory.map((r) => ({
        label: CATEGORY_LABELS[r.category] ?? r.category,
        count: r.count,
      })),
    },
    {
      title: 'Prioridad',
      items: data.byPriority.map((r) => ({
        label: PRIORITY_LABELS[r.priority] ?? r.priority,
        count: r.count,
      })),
    },
    {
      title: 'Severidad',
      items: data.bySeverity.map((r) => ({
        label: SEVERITY_LABELS[r.severity] ?? r.severity,
        count: r.count,
      })),
    },
    {
      title: 'Área',
      items: data.byArea.map((r) => ({
        label: r.areaName,
        count: r.count,
      })),
    },
  ];

  const halfW = (contentW - gap) / 2;
  let distY = y;
  distributions.forEach((block, i) => {
    const col = i % 2;
    if (col === 0 && i > 0) {
      distY += 118;
      if (distY + 120 > pageH - 60) {
        doc.addPage();
        drawContinuationHeader(doc, fonts, pageW, marginX, contentW, data);
        distY = 56;
      }
    }
    const x = marginX + col * (halfW + gap);
    const blockY = col === 0 ? distY : distY;
    drawBarBlock(doc, fonts, x, blockY, halfW, block.title, block.items);
  });
  y = distY + 126;

  if (y + 140 > pageH - 50) {
    doc.addPage();
    drawContinuationHeader(doc, fonts, pageW, marginX, contentW, data);
    y = 56;
  }

  y = drawSectionTitle(doc, fonts, marginX, y, contentW, 'Equipo');
  y = drawTable(
    doc,
    fonts,
    marginX,
    y,
    contentW,
    ['Técnico', 'Asignados', 'Resueltos', 'Prom. h'],
    [0.4, 0.2, 0.2, 0.2],
    data.byTechnician.map((r) => [
      r.userName,
      String(r.assigned),
      String(r.resolved),
      formatHours(r.avgResolutionHours),
    ]),
    pageH,
    () => {
      doc.addPage();
      drawContinuationHeader(doc, fonts, pageW, marginX, contentW, data);
      return 56;
    },
  );

  y += 14;
  if (y + 100 > pageH - 50) {
    doc.addPage();
    drawContinuationHeader(doc, fonts, pageW, marginX, contentW, data);
    y = 56;
  }

  y = drawTable(
    doc,
    fonts,
    marginX,
    y,
    contentW,
    ['Reportante', 'Tickets'],
    [0.7, 0.3],
    data.byReporter.map((r) => [r.userName, String(r.count)]),
    pageH,
    () => {
      doc.addPage();
      drawContinuationHeader(doc, fonts, pageW, marginX, contentW, data);
      return 56;
    },
  );

  // Trends sparkbars if space / new page
  if (data.trends.length > 0) {
    y += 18;
    if (y + 90 > pageH - 50) {
      doc.addPage();
      drawContinuationHeader(doc, fonts, pageW, marginX, contentW, data);
      y = 56;
    }
    y = drawSectionTitle(
      doc,
      fonts,
      marginX,
      y,
      contentW,
      'Tendencia diaria (creados vs resueltos)',
    );
    drawMiniTrend(doc, fonts, marginX, y, contentW, data.trends);
  }

  // Footers on all pages
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const footerY = pageH - 28;
    doc
      .moveTo(marginX, footerY - 8)
      .lineTo(pageW - marginX, footerY - 8)
      .strokeColor(`#${BRAND.border}`)
      .lineWidth(0.5)
      .stroke();
    doc
      .font(fonts.regular)
      .fontSize(8)
      .fillColor(`#${BRAND.muted}`)
      .text(fonts.t('FixDesk · Confidencial'), marginX, footerY, {
        width: contentW * 0.5,
        align: 'left',
      });
    doc.text(
      fonts.t(`Página ${i + 1} de ${range.count}`),
      marginX,
      footerY,
      { width: contentW, align: 'right' },
    );
  }

  doc.end();
  return done;
}

function drawContinuationHeader(
  doc: PDFKit.PDFDocument,
  fonts: PdfFonts,
  pageW: number,
  marginX: number,
  contentW: number,
  data: ReportsExportData,
) {
  doc.rect(0, 0, pageW, 36).fill(`#${BRAND.primary}`);
  doc
    .fillColor('#FFFFFF')
    .font(fonts.bold)
    .fontSize(10)
    .text(fonts.t('FixDesk — Continuación del reporte'), marginX, 12, {
      width: contentW * 0.55,
    });
  doc
    .font(fonts.regular)
    .fontSize(8)
    .fillColor('#A8CED6')
    .text(fonts.t(periodLabel(data)), marginX, 14, {
      width: contentW,
      align: 'right',
    });
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  fonts: PdfFonts,
  x: number,
  y: number,
  w: number,
  title: string,
): number {
  doc
    .fillColor(`#${BRAND.primary}`)
    .font(fonts.bold)
    .fontSize(13)
    .text(fonts.t(title), x, y, { width: w });
  doc
    .moveTo(x, y + 18)
    .lineTo(x + 48, y + 18)
    .strokeColor(`#${BRAND.accent}`)
    .lineWidth(2)
    .stroke();
  return y + 28;
}

function drawBarBlock(
  doc: PDFKit.PDFDocument,
  fonts: PdfFonts,
  x: number,
  y: number,
  w: number,
  title: string,
  items: { label: string; count: number }[],
) {
  doc
    .roundedRect(x, y, w, 108, 6)
    .fill(`#${BRAND.surface}`);

  doc
    .fillColor(`#${BRAND.primary}`)
    .font(fonts.bold)
    .fontSize(10)
    .text(fonts.t(title), x + 10, y + 8, { width: w - 20 });

  const max = Math.max(...items.map((i) => i.count), 1);
  const rowH = 16;
  const top = y + 26;
  const barMax = w - 100;
  const visible = items.slice(0, 4);

  visible.forEach((item, i) => {
    const iy = top + i * rowH;
    doc
      .fillColor(`#${BRAND.muted}`)
      .font(fonts.regular)
      .fontSize(8)
      .text(fonts.t(item.label), x + 10, iy, {
        width: 62,
        height: 12,
        ellipsis: true,
      });

    const barW = Math.max(4, (item.count / max) * barMax);
    doc
      .roundedRect(x + 74, iy + 2, barW, 8, 2)
      .fill(`#${BRAND.accent}`);

    doc
      .fillColor(`#${BRAND.text}`)
      .font(fonts.bold)
      .fontSize(8)
      .text(String(item.count), x + 74 + barW + 4, iy, {
        width: 28,
      });
  });

  if (items.length === 0) {
    doc
      .fillColor(`#${BRAND.muted}`)
      .font(fonts.regular)
      .fontSize(8)
      .text(fonts.t('Sin datos'), x + 10, top);
  }
}

function drawTable(
  doc: PDFKit.PDFDocument,
  fonts: PdfFonts,
  x: number,
  y: number,
  w: number,
  headers: string[],
  ratios: number[],
  rows: string[][],
  pageH: number,
  onNewPage: () => number,
): number {
  const rowH = 18;
  const colXs: number[] = [];
  let acc = x;
  ratios.forEach((r) => {
    colXs.push(acc);
    acc += w * r;
  });

  const paintHeader = (hy: number) => {
    doc.rect(x, hy, w, rowH).fill(`#${BRAND.primary}`);
    headers.forEach((h, i) => {
      doc
        .fillColor('#FFFFFF')
        .font(fonts.bold)
        .fontSize(8)
        .text(fonts.t(h), colXs[i]! + 6, hy + 5, {
          width: w * ratios[i]! - 10,
        });
    });
  };

  paintHeader(y);
  y += rowH;

  if (rows.length === 0) {
    doc
      .fillColor(`#${BRAND.muted}`)
      .font(fonts.regular)
      .fontSize(8)
      .text(fonts.t('Sin registros en este período'), x + 6, y + 6);
    return y + 24;
  }

  for (let i = 0; i < rows.length; i++) {
    if (y + rowH > pageH - 40) {
      y = onNewPage();
      paintHeader(y);
      y += rowH;
    }

    if (i % 2 === 1) {
      doc.rect(x, y, w, rowH).fill(`#${BRAND.zebra}`);
    } else {
      doc.rect(x, y, w, rowH).fill('#FFFFFF');
    }

    rows[i]!.forEach((cell, ci) => {
      const align = ci === 0 ? 'left' : 'right';
      doc
        .fillColor(`#${BRAND.text}`)
        .font(fonts.regular)
        .fontSize(8)
        .text(fonts.t(cell), colXs[ci]! + 6, y + 5, {
          width: w * ratios[ci]! - 12,
          align,
          height: 12,
          ellipsis: true,
        });
    });
    y += rowH;
  }

  return y;
}

function drawMiniTrend(
  doc: PDFKit.PDFDocument,
  fonts: PdfFonts,
  x: number,
  y: number,
  w: number,
  trends: { date: string; created: number; resolved: number }[],
) {
  const height = 70;
  const chartH = 48;
  doc.roundedRect(x, y, w, height, 6).fill(`#${BRAND.surface}`);

  const sample =
    trends.length > 28
      ? trends.filter((_, i) => i % Math.ceil(trends.length / 28) === 0)
      : trends;
  const max = Math.max(
    ...sample.map((t) => Math.max(t.created, t.resolved)),
    1,
  );
  const barGroupW = w / sample.length;
  const barW = Math.max(2, barGroupW * 0.35);

  sample.forEach((point, i) => {
    const bx = x + i * barGroupW + barGroupW * 0.15;
    const createdH = (point.created / max) * chartH;
    const resolvedH = (point.resolved / max) * chartH;
    const base = y + 8 + chartH;

    doc
      .rect(bx, base - createdH, barW, createdH)
      .fill(`#${BRAND.accent}`);
    doc
      .rect(bx + barW + 1, base - resolvedH, barW, resolvedH)
      .fill(`#${BRAND.success}`);
  });

  doc
    .fillColor(`#${BRAND.muted}`)
    .font(fonts.regular)
    .fontSize(7)
    .text(
      fonts.t('Teal: creados   ·   Verde: resueltos'),
      x + 8,
      y + height - 14,
      { width: w - 16 },
    );
}
