import mongoose from "mongoose";
import { ITaxType } from "@/types";

// ── Tax Type Schema ─────────────────────────────────────
// User-managed tax types. The frontend loads these to let users
// pick which taxes apply to each bill (Step 3 of the wizard).
const taxTypeSchema = new mongoose.Schema({
  // Display name (e.g. "GST", "Income Tax", "PST", "ADC Fee")
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // Default rate (e.g. 18 for 18%)
  percentage: {
    type: Number,
    required: true,
  },
  // Soft toggle — inactive types won't appear in the selection UI
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Use existing model if already compiled (Next.js hot-reload safe)
const TaxTypeModel =
  mongoose.models.TaxType || mongoose.model<ITaxType>("TaxType", taxTypeSchema);

export default TaxTypeModel;
