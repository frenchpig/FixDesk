export type Role = 'USER' | 'TECHNICIAN' | 'ADMIN';

export type TicketCategory =
  | 'HARDWARE'
  | 'NETWORK'
  | 'INFRASTRUCTURE'
  | 'ELECTRICAL';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'RESOLVED'
  | 'CANCELLED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/** Impacto del incidente (distinto de prioridad operativa). */
export type TicketSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type HistoryEventType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'NOTE_ADDED'
  | 'PHOTO_ADDED'
  | 'UPDATED';

export type NotificationType = 'STATUS_CHANGED' | 'ASSIGNED' | 'NOTE_ADDED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  ticketId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface TicketLabel {
  id: string;
  name: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  area?: { id: string; name: string } | null;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  location: string;
  photoUrl?: string | null;
  reporter: { id: string; name: string; email?: string };
  assignee?: { id: string; name: string } | null;
  area?: { id: string; name: string } | null;
  labels?: TicketLabel[];
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketHistoryEntry {
  id: string;
  eventType: HistoryEventType;
  oldStatus?: TicketStatus | null;
  newStatus?: TicketStatus | null;
  note?: string | null;
  user: { id: string; name: string };
  createdAt: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ReportFilterOption {
  id: string;
  name: string;
  role?: Role;
}

export interface ReportKpis {
  created: number;
  resolved: number;
  cancelled: number;
  openBacklog: number;
  inProgress: number;
  pending: number;
  highPriorityOpen: number;
  resolutionRate: number;
  cancellationRate: number;
  avgResolutionHours: number | null;
  avgFirstResponseHours: number | null;
  slaComplianceRate: number | null;
  slaTargetHours: number;
}

export interface ReportAreaItem {
  areaId: string | null;
  areaName: string;
  count: number;
}

export interface ReportTechnicianItem {
  userId: string;
  userName: string;
  assigned: number;
  resolved: number;
  avgResolutionHours: number | null;
}

export interface ReportReporterItem {
  userId: string;
  userName: string;
  count: number;
}

export interface ReportTrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface ReportsMetrics {
  period: { from: string; to: string };
  kpis: ReportKpis;
  byStatus: { status: TicketStatus; count: number }[];
  byCategory: { category: TicketCategory; count: number }[];
  byPriority: { priority: TicketPriority; count: number }[];
  byArea: ReportAreaItem[];
  byTechnician: ReportTechnicianItem[];
  byReporter: ReportReporterItem[];
  trends: ReportTrendPoint[];
}

export interface ReportFilterOptions {
  areas: { id: string; name: string }[];
  technicians: ReportFilterOption[];
  reporters: ReportFilterOption[];
}

export type DatePreset = 'last7' | 'last30' | 'last90' | 'thisMonth' | 'custom';

export interface ReportFilters {
  preset: DatePreset;
  dateFrom: string;
  dateTo: string;
  category: TicketCategory | '';
  status: TicketStatus | '';
  priority: TicketPriority | '';
  areaId: string;
  assigneeId: string;
  reporterId: string;
}

export interface HistorialFilters {
  q: string;
  status: TicketStatus | '';
  priority: TicketPriority | '';
  severity: TicketSeverity | '';
  category: TicketCategory | '';
  labelId: string;
  assigneeId: string;
  location: string;
  dateFrom: string;
  dateTo: string;
}
