// ── Barrel re-exports ───────────────────────────────────
// All types are split into domain-specific files for readability.
// Import from "@/types" still works as before — no breaking changes.

export type { IClient } from "./client";
export type { ITaxType } from "./taxType";
export type { ICategory } from "./category";
export type { ITaxCharge, IBill } from "./bill";
export type {
  SummaryStatus,
  ISummary,
  ISummaryPopulated,
  CreateSummaryPayload,
} from "./summary";