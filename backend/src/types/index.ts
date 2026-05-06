import type {ProjectRole, TimeEntryStatus} from "@prisma/client";

export type { TimeEntryStatus, ProjectRole };

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  roles: string[];
  projectIds: string[];
  iat?: number;
  exp?: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface UserDetail extends UserSummary {
  documentNumber: string;
  jobTitle: string;
  phone: string | null;
  isActive: boolean;
  isStaff: boolean;
  isSuperUser: boolean;
  hireDate: Date;
  team: { id: string; name: string } | null;
  areas: Array<{ id: string; name: string }>;
  groups: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export interface ClientSummary {
  id: string;
  name: string;
  taxId: string;
  isActive: boolean;
  createdAt: Date;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  manager: UserSummary | null;
}

// ─── TimeEntry ────────────────────────────────────────────────────────────────

export interface TimeEntryLine {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  incomeCategoryId: string | null;
  incomeCategoryName: string | null;
  hours: number;
  extraHours: number;
  comment: string | null;
}

export interface TimeEntrySummary {
  id: string;
  week: string;
  status: TimeEntryStatus;
  createdAt: Date;
  user: UserSummary;
}

// ─── HourProjection ───────────────────────────────────────────────────────────

export interface HourProjectionDetail {
  id: string;
  projectId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  projectedHours: number;
  notes: string | null;
}
