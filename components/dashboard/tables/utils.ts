/**
 * Utility Functions for Dashboard Tables
 * =======================================
 */

/**
 * Formats a date string to a human-readable format.
 *
 * @param dateStr - ISO date string or undefined
 * @returns Formatted date like "21 Mar 2026" or "—" if invalid
 *
 * @example
 * formatDate("2026-03-21T10:30:00Z") // "21 Mar 2026"
 * formatDate(undefined)              // "—"
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";

  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a number as PKR currency.
 *
 * @param amount - The numeric amount to format
 * @returns Formatted currency string like "Rs 1,234"
 *
 * @example
 * formatCurrency(1234.56) // "Rs 1,235"
 * formatCurrency(0)       // "Rs 0"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
