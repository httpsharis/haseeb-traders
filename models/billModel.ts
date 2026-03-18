import mongoose, { Schema } from "mongoose";

// ── Tax Charge Sub-Schema ───────────────────────────────
// The specific taxes applied to this single bill item.
// Each bill can have different taxes applied independently.
const taxChargeSchema = new Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  baseAmount: { type: Number, required: true },
  amount: { type: Number, required: true },
});

// ── Bill Schema ─────────────────────────────────────────
// A Bill is the child item. It always links to a parent Summary.
// Each bill has its own date, category, and tax selections.
const billSchema = new Schema({
  // Reference to the parent Summary this bill belongs to
  summary: { type: Schema.Types.ObjectId, ref: "Summary", required: true },
  // Reference bill/invoice number (e.g. "92")
  billNumber: { type: String },
  // Date of this individual bill
  date: { type: Date },
  // Description of the work/item (e.g. "Cement", "Labour for Wall Repair")
  description: { type: String, required: true },
  // Category of this bill (e.g. "Building Materials") — picked per bill
  category: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  // Taxes applied to this specific bill (selected on the taxes step)
  taxes: [taxChargeSchema],
}, { timestamps: true });

// Use existing model if already compiled (Next.js hot-reload safe)
export default mongoose.models.Bill || mongoose.model("Bill", billSchema);