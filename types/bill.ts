// ── Tax Charge (Applied to a Bill) ──────────────────────
// Represents a single tax line-item calculated and stored on a bill
export interface ITaxCharge {
  name: string;       // Tax type name at time of creation
  percentage: number;  // Rate used for calculation
  baseAmount: number;  // Amount the tax was calculated on
  amount: number;      // Final tax amount
}

// ── Single Bill Item (Child) ────────────────────────────
// A Bill is the child document. It always belongs to a Summary.
export interface IBill {
  _id?: string;
  summary?: string | import("mongoose").Types.ObjectId; // Links to the parent Summary
  billNumber?: string;                // Reference bill/invoice number (e.g. "92")
  date?: Date | string;               // Date of this individual bill
  description: string;
  category?: string;                   // e.g. "Textiles", "Building Materials"
  quantity: number;
  unitPrice: number;
  taxes: ITaxCharge[];
}
