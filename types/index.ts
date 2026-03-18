import { Types } from "mongoose";

// ── Client ──────────────────────────────────────────────
export interface IClient {
  _id?: string;
  name: string;
}

// ── Invoice Item (New) ─────────────────────────────────────
export interface IInvoiceItem {
  description: string;
  category: string;
  qty: number;
  unitPrice: number;
  gstPercentage: number;
}

// ── Invoice ────────────────────────────────────────────────
export type InvoiceStatus = "draft" | "converted";

export interface IInvoice {
  _id: string;
  client: IClient | Types.ObjectId;
  billNumber: string;
  date: Date;
  taxPeriod: string;
  status: string;
  items: IInvoiceItem[];
  taxes: ITaxCharge[]; // New line
}

/** Populated invoice — after `.populate("client")` */
export interface IInvoicePopulated extends Omit<IInvoice, "client"> {
  client: IClient;
}

// Add this new interface
export interface ITaxCharge {
  name: string;
  percentage: number;
  baseAmount: number;
  amount: number;
}

/** Payload for POST /api/invoices */
export interface CreateInvoicePayload {
  clientId: string;
  billNumber: string;
  date: string;
  taxPeriod: string;
  status?: string;
  items: IInvoiceItem[];
  taxes: ITaxCharge[]; // New line
}
