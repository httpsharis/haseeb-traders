import { Types } from "mongoose";

// ── Client ──────────────────────────────────────────────
export interface IClient {
  _id?: string;
  name: string;
}

// ── Bill ────────────────────────────────────────────────
export type BillStatus = "draft" | "converted";

export interface IBill {
  _id: string;
  client: IClient | Types.ObjectId;
  billNumber: string;
  date: Date;
  taxPeriod: string;
  status: BillStatus;
}

/** Populated bill — after `.populate("client")` */
export interface IBillPopulated extends Omit<IBill, "client"> {
  client: IClient;
}

/** Payload for POST /api/bills */
export interface CreateBillPayload {
  clientId: string;
  billNumber: string;
  date: string;
  taxPeriod: string;
  status?: BillStatus;
}
