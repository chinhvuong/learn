/**
 * Convert value to number safely
 * Handles string, number, or null/undefined values
 */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  return parseFloat(String(value)) || 0;
}
