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
  let response: Response;

  try {
    response = await fetch("/api/financial/facts");
  } catch (error) {
    throw toNetworkError(error);
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
    !isValidStatus ||
    typeof candidate.plannedMargin !== "number" ||
    typeof candidate.actualMargin !== "number" ||
    typeof candidate.marginVariance !== "number"
  ) {
    throw new FinancialApiError("validation_error", "Financial facts response has invalid shape");
  }

  return {
    computeKey: candidate.computeKey,
    month: candidate.month,
    status,
    plannedMargin: candidate.plannedMargin,
    actualMargin: candidate.actualMargin,
    marginVariance: candidate.marginVariance
  };
}

function isMonthlyFactStatus(value: unknown): value is MonthlyFinancialFact["status"] {
  return value === "blocked" || value === "provisional" || value === "final";
}
