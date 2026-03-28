// ── Tax Type (Configuration) ────────────────────────────
// User-managed tax types (e.g. GST 18%, Income Tax 5.5%, PST 16%)
export interface ITaxType {
  _id?: string;
  name: string;        // e.g. "GST", "Income Tax", "PST"
  percentage: number;  // e.g. 18, 5.5, 16
  isActive: boolean;   // Soft toggle — inactive types won't appear in dropdowns
}
