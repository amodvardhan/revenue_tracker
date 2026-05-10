import { notifyUnauthorized } from "../../../app/apiUnauthorized";
import { getToken } from "../../../app/session";
import type { MonthlyFinancialFact } from "../models/financial";

export type FinancialApiErrorKind =
  | "network_error"
  | "http_error"
  | "parse_error"
  | "validation_error";

export class FinancialApiError extends Error {
  readonly kind: FinancialApiErrorKind;
  readonly statusCode?: number;

  constructor(kind: FinancialApiErrorKind, message: string, statusCode?: number) {
    super(message);
    this.name = "FinancialApiError";
    this.kind = kind;
    this.statusCode = statusCode;
  }
}

export async function getFinancialFacts(): Promise<MonthlyFinancialFact[]> {
  const apiUrl = resolveFinancialFactsUrl();
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(apiUrl, { headers });
  } catch (error) {
    throw toNetworkError(error);
  }

  if (response.status === 401 && token) {
    notifyUnauthorized();
  }

  if (!response.ok) {
    throw new FinancialApiError(
      "http_error",
      `Financial facts request failed with status ${response.status}`,
      response.status
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new FinancialApiError("parse_error", "Financial facts response is not valid JSON");
  }

  return validateFinancialFactsPayload(payload);
}

function resolveFinancialFactsUrl(): string {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    return "/api/financial/facts";
  }

  return `${baseUrl}/api/financial/facts`;
}

function toNetworkError(error: unknown): FinancialApiError {
  if (error instanceof FinancialApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new FinancialApiError("network_error", `Financial facts network failure: ${error.message}`);
  }

  return new FinancialApiError("network_error", "Financial facts network failure");
}

function validateFinancialFactsPayload(payload: unknown): MonthlyFinancialFact[] {
  if (!Array.isArray(payload)) {
    throw new FinancialApiError("validation_error", "Financial facts response has invalid shape");
  }

  return payload.map((item) => validateFinancialFact(item));
}

/** Accepts JSON numbers and numeric strings (some servers / proxies alter number encoding). */
function requireFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  throw new FinancialApiError("validation_error", "Financial facts response has invalid shape");
}

function validateFinancialFact(item: unknown): MonthlyFinancialFact {
  if (typeof item !== "object" || item == null) {
    throw new FinancialApiError("validation_error", "Financial facts response has invalid shape");
  }

  const candidate = item as Record<string, unknown>;
  const status = candidate.status;
  const isValidStatus = isMonthlyFactStatus(status);
  if (
    typeof candidate.computeKey !== "string" ||
    typeof candidate.month !== "string" ||
    typeof candidate.employeeId !== "string" ||
    typeof candidate.projectId !== "string" ||
    typeof candidate.projectName !== "string" ||
    typeof candidate.account !== "string" ||
    typeof candidate.clientName !== "string" ||
    typeof candidate.teamMemberName !== "string" ||
    !isValidStatus
  ) {
    throw new FinancialApiError("validation_error", "Financial facts response has invalid shape");
  }

  const signedRevenue = requireFiniteNumber(candidate.signedRevenue);
  const projectedRevenue = requireFiniteNumber(candidate.projectedRevenue);
  const totalRevenue = requireFiniteNumber(candidate.totalRevenue);
  const actualCost = requireFiniteNumber(candidate.actualCost);
  const plannedRevenue = requireFiniteNumber(candidate.plannedRevenue);
  const plannedMargin = requireFiniteNumber(candidate.plannedMargin);
  const actualMargin = requireFiniteNumber(candidate.actualMargin);
  const marginVariance = requireFiniteNumber(candidate.marginVariance);

  return {
    computeKey: candidate.computeKey,
    month: candidate.month,
    employeeId: candidate.employeeId,
    projectId: candidate.projectId,
    projectName: candidate.projectName,
    account: candidate.account,
    accountDisplayName: typeof candidate.accountDisplayName === "string" ? candidate.accountDisplayName : undefined,
    businessUnitCode: typeof candidate.businessUnitCode === "string" ? candidate.businessUnitCode : undefined,
    businessUnitName: typeof candidate.businessUnitName === "string" ? candidate.businessUnitName : undefined,
    clientName: candidate.clientName,
    teamMemberName: candidate.teamMemberName,
    status,
    signedRevenue,
    projectedRevenue,
    totalRevenue,
    actualCost,
    plannedRevenue,
    plannedMargin,
    actualMargin,
    marginVariance
  };
}

function isMonthlyFactStatus(value: unknown): value is MonthlyFinancialFact["status"] {
  return value === "blocked" || value === "provisional" || value === "final";
}
