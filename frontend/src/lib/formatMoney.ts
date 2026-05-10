/** ISO 4217 currency formatting shared across the app (driven by configured default currency). */

export function formatCurrencyAmount(
  value: number,
  currencyCode: string,
  overrides?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...overrides
  }).format(value);
}

/** Compact currency for chart axes (locale-aware symbol + magnitude). */
export function formatCurrencyCompact(value: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

/** Signed currency (+ and −) for variances and deltas. */
export function formatCurrencySigned(value: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always"
  }).format(value);
}
