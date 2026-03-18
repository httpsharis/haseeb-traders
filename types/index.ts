import { Types } from "mongoose";

// ── Client ──────────────────────────────────────────────
export interface IClient {
  _id?: string;
  name: string;
}

// ── Tax Type (Configuration) ────────────────────────────
// User-managed tax types (e.g. GST 18%, Income Tax 5.5%, PST 16%)
export interface ITaxType {
  _id?: string;
  name: string;        // e.g. "GST", "Income Tax", "PST"
  percentage: number;  // e.g. 18, 5.5, 16
  isActive: boolean;   // Soft toggle — inactive types won't appear in dropdowns
}

// ── Category (Configuration) ────────────────────────────
// User-managed bill categories (e.g. Textiles, Accessories, Electrical)
export interface ICategory {
  _id?: string;
  name: string;
  isActive: boolean;
}

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
  summary?: string | Types.ObjectId; // Links to the parent Summary
  billNumber?: string;                // Reference bill/invoice number (e.g. "92")
  date?: Date | string;               // Date of this individual bill
  description: string;
  category?: string;                   // e.g. "Textiles", "Building Materials"
  quantity: number;
  unitPrice: number;
  taxes: ITaxCharge[];
}

// ── Master Summary (Parent) ─────────────────────────────
// A Summary is the parent folder. It links to a Client.
export type SummaryStatus = "Draft" | "Converted";

export interface ISummary {
  _id?: string;
  client: string | Types.ObjectId; // Links to the Client
  summaryNumber: string;            // Unique identifier (e.g. "6")
  date?: Date | string;             // Summary date
  taxPeriod: string;                 // e.g. "Mar 2025"
  status: SummaryStatus | string;
  discount?: number;                 // Optional discount amount
  commission?: number;               // Optional commission amount
  bills?: IBill[];                   // Virtual — populated at query time
}

/** Populated summary — after `.populate("client")` */
export interface ISummaryPopulated extends Omit<ISummary, "client"> {
  client: IClient;
  bills: IBill[];
}

/** Payload for POST /api/summaries */
export interface CreateSummaryPayload {
  client: string;
  summaryNumber: string;
  date?: string;
  taxPeriod: string;
  status?: SummaryStatus | string;
  discount?: number;
  commission?: number;
  bills: IBill[];
}