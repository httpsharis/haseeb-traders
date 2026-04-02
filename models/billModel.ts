import mongoose, { Schema } from "mongoose";

// ── Tax Charge Sub-Schema ───────────────────────────────
const taxChargeSchema = new Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  baseAmount: { type: Number, required: true },
  amount: { type: Number, required: true },
});

// ── Bill Schema ─────────────────────────────────────────
const billSchema = new Schema({
  client: { 
    type: Schema.Types.ObjectId, 
    ref: "Client", 
    required: true 
  },
  summary: { 
    type: Schema.Types.ObjectId, 
    ref: "Summary", 
    required: false 
  },
  status: { 
    type: String, 
    enum: ["Unbilled", "Summarized"], 
    default: "Unbilled" 
  },
  billNumber: { type: String },
  date: { type: Date },
  description: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxes: [taxChargeSchema],
}, { timestamps: true });

export default mongoose.models.Bill || mongoose.model("Bill", billSchema);