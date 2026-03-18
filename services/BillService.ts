import billModel from "@/models/billModel";
import { IBill } from "@/types";

// ── Get all bills for a specific summary ────────────────
export async function getBillsBySummaryService(summaryId: string) {
  return await billModel.find({ summary: summaryId }).sort({ createdAt: -1 });
}

// ── Get a single bill by its ID ─────────────────────────
export async function getSingleBillService(id: string) {
  return await billModel.findById(id);
}

// ── Update an existing bill ─────────────────────────────
export async function updateBillService(id: string, data: Partial<IBill>) {
  return await billModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

// ── Delete a single bill ────────────────────────────────
export async function deleteBillService(id: string) {
  return await billModel.findByIdAndDelete(id);
}

// ── Delete all bills for a summary (cascade) ────────────
// Called when a parent Summary is deleted.
export async function deleteBillsBySummaryService(summaryId: string) {
  return await billModel.deleteMany({ summary: summaryId });
}
