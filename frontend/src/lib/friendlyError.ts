/**
 * Turns raw API / network messages into short, actionable copy.
 */
export function friendlyError(input: unknown): string {
  const raw =
    input instanceof Error ? input.message : typeof input === "string" ? input : "Something went wrong. Try again.";
  const lower = raw.toLowerCase();

  if (lower.includes("invalid email") || lower.includes("invalid email or password")) {
    return "That email or password doesn’t match our records.";
  }
  if (lower.includes("missing or invalid session") || lower.includes("session expired") || lower.includes("401")) {
    return "Your session expired—sign in again.";
  }
  if (lower.includes("forbidden") || lower.includes("403") || lower.includes("insufficient role")) {
    return "Your role can’t perform that action.";
  }
  if (lower.includes("assignmentid does not belong")) {
    return "Pick an assignment that belongs to the project you selected.";
  }
  if (lower.includes("actualdays cannot exceed")) {
    return "Actual days are higher than allowed for this assignment’s allocation.";
  }
  if (lower.includes("month must match")) {
    return "Use a calendar month like 2026-03.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Can’t reach the server. Check your connection and try again.";
  }
  if (lower.includes("not found")) {
    return "That record no longer exists—it may have been removed.";
  }

  return raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;
}
