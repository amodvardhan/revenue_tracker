import { getToken } from "../../../app/session";
import { notifyUnauthorized } from "../../../app/apiUnauthorized";

export interface LoginResponse {
  token: string;
  role: string;
  userId: string;
}

export interface ProjectRow {
  id: string;
  projectName: string;
  clientName: string;
  account: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AssignmentRow {
  id: string;
  projectId: string;
  employeeId: string;
  teamMemberName: string;
  allocationPercent: number;
  dailyRate: number;
  signedStartDate: string;
  signedEndDate: string;
}

export interface CreateProjectPayload {
  projectName: string;
  clientName: string;
  account: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateAssignmentPayload {
  employeeId: string;
  teamMemberName: string;
  allocationPercent: number;
  dailyRate: number;
  signedStartDate: string;
  signedEndDate: string;
}

export interface RecordAttendancePayload {
  assignmentId: string;
  month: string;
  actualDays: number;
}

export interface AttendanceRecord {
  id: string;
  assignmentId: string;
  month: string;
  actualDays: number;
  assignment: {
    teamMemberName: string;
    employeeId: string;
  };
}

export interface RecomputePayload {
  employeeId: string;
  projectId: string;
  month: string;
}

export interface RateRevisionPayload {
  effectiveDate: string;
  newRate: number;
  authorizerId: string;
}

export interface ProjectionPayload {
  startDate: string;
  endDate: string;
  projectionRate: number;
}

export interface AppSettingsDto {
  defaultCurrencyCode: string;
  defaultRevenueDays: number;
}

export interface UpdateAppSettingsPayload {
  defaultCurrencyCode?: string;
  defaultRevenueDays?: number;
}

function apiBase(): string {
  const env = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return env?.replace(/\/$/, "") ?? "";
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") {
      return record.message;
    }
    if (Array.isArray(record.message)) {
      return record.message.map(String).join(", ");
    }
  }
  return `Request failed (${status})`;
}

async function requestJson<T>(
  path: string,
  options: RequestInit & { token?: string | null; skipAuth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.skipAuth ? null : options.token ?? getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401 && token) {
    notifyUnauthorized();
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.status));
  }

  return payload as T;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return requestJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true
  });
}

export async function logout(token: string): Promise<{ success: true }> {
  return requestJson<{ success: true }>("/api/auth/logout", {
    method: "POST",
    token
  });
}

export async function listProjects(): Promise<ProjectRow[]> {
  return requestJson<ProjectRow[]>("/api/projects");
}

export async function listAssignments(projectId: string): Promise<AssignmentRow[]> {
  return requestJson<AssignmentRow[]>(`/api/projects/${projectId}/assignments`);
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectRow> {
  return requestJson<ProjectRow>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createAssignment(
  projectId: string,
  payload: CreateAssignmentPayload
): Promise<AssignmentRow> {
  return requestJson<AssignmentRow>(`/api/projects/${projectId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listAttendance(projectId: string): Promise<AttendanceRecord[]> {
  return requestJson<AttendanceRecord[]>(`/api/projects/${projectId}/attendance`);
}

export async function recordAttendance(
  projectId: string,
  payload: RecordAttendancePayload
): Promise<Pick<AttendanceRecord, "id" | "assignmentId" | "month" | "actualDays">> {
  return requestJson<Pick<AttendanceRecord, "id" | "assignmentId" | "month" | "actualDays">>(
    `/api/projects/${projectId}/attendance`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function deleteAttendance(projectId: string, attendanceId: string): Promise<{ deleted: true }> {
  return requestJson<{ deleted: true }>(`/api/projects/${projectId}/attendance/${attendanceId}`, {
    method: "DELETE"
  });
}

export async function recomputeRevenue(payload: RecomputePayload): Promise<{ recomputedKeys: string[] }> {
  return requestJson<{ recomputedKeys: string[] }>("/api/financial/recompute", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createRateRevision(
  assignmentId: string,
  payload: RateRevisionPayload
): Promise<{ id: string }> {
  return requestJson<{ id: string }>(`/api/assignments/${assignmentId}/rate-revisions`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createProjection(
  assignmentId: string,
  payload: ProjectionPayload
): Promise<{ id: string }> {
  return requestJson<{ id: string }>(`/api/assignments/${assignmentId}/projections`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export interface BulkAssignmentRow {
  employeeId: string;
  teamMemberName: string;
  allocationPercent: number;
  dailyRate: number;
  signedStartDate: string;
  signedEndDate: string;
}

export async function bulkUploadAssignments(
  projectId: string,
  rows: BulkAssignmentRow[]
): Promise<{ createdCount: number }> {
  return requestJson<{ createdCount: number }>(
    `/api/projects/${projectId}/assignments/bulk-upload`,
    {
      method: "POST",
      body: JSON.stringify({ rows })
    }
  );
}

export interface BulkAttendanceRow {
  assignmentId: string;
  month: string;
  actualDays: number;
}

export async function bulkUploadAttendance(
  projectId: string,
  rows: BulkAttendanceRow[]
): Promise<{ createdCount: number }> {
  return requestJson<{ createdCount: number }>(
    `/api/projects/${projectId}/attendance/bulk-upload`,
    {
      method: "POST",
      body: JSON.stringify({ rows })
    }
  );
}

export interface BulkProjectionRow {
  assignmentId: string;
  startDate: string;
  endDate: string;
  projectionRate: number;
}

export async function bulkUploadProjections(rows: BulkProjectionRow[]): Promise<{ createdCount: number }> {
  return requestJson<{ createdCount: number }>("/api/projections/bulk-upload", {
    method: "POST",
    body: JSON.stringify({ rows })
  });
}

export async function getAppSettings(): Promise<AppSettingsDto> {
  return requestJson<AppSettingsDto>("/api/settings");
}

export async function updateAppSettings(payload: UpdateAppSettingsPayload): Promise<AppSettingsDto> {
  return requestJson<AppSettingsDto>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function validateYearMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value.trim());
}
