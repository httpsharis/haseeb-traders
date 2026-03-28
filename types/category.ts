// ── Category (Configuration) ────────────────────────────
// User-managed bill categories (e.g. Textiles, Accessories, Electrical)
export interface ICategory {
  _id?: string;
  name: string;
  isActive: boolean;
}
