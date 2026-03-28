import type { IClient } from "./client";
import type { IBill } from "./bill";

// ── Master Summary (Parent) ─────────────────────────────
// A Summary is the parent folder. It links to a Client.
export type SummaryStatus = "Draft" | "Converted";

export interface ISummary {
  _id?: string;
  client: string | import("mongoose").Types.ObjectId; // Links to the Client
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
