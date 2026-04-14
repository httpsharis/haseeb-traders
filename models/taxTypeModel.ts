import mongoose, { Schema } from "mongoose";
import { TaxRule } from "@/types"; 

// ── Tax Type Schema ─────────────────────────────────────
// User-managed tax types. The frontend loads these to let users
// pick which taxes apply to each bill or summary.
const taxTypeSchema = new Schema({
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
  
  // --- NEW: CRITICAL FOR THE MATH ENGINE ---
  target: { 
    type: String, 
    enum: ["BaseAmount", "SubtotalAmount"], 
    default: "BaseAmount" 
  },
  impact: { 
    type: String, 
    enum: ["Add", "DisplayOnly"], 
    default: "Add" 
  },
  
  // Soft toggle — inactive types won't appear in the selection UI
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Use existing model if already compiled (Next.js hot-reload safe)
const TaxTypeModel = mongoose.models.TaxType || mongoose.model<TaxRule>("TaxType", taxTypeSchema);

export default TaxTypeModel;