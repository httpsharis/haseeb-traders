import mongoose, { Schema } from "mongoose";

// ── Tax Charge Sub-Schema ───────────────────────────────
const taxChargeSchema = new Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  baseAmount: { type: Number, required: true },
  amount: { type: Number, required: true },
});

// ── NEW: Line Item Sub-Schema ───────────────────────────
const lineItemSchema = new Schema({
  description: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true },
  taxes: [taxChargeSchema]
});

// ── Upgraded Bill Schema (Master Invoice) ───────────────
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
  
  // Master Totals & Info
  description: { type: String, default: "Combined Invoice" },
  category: { type: String, default: "Multiple Items" },
  baseAmount: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  amount: { type: Number, required: true },
  
  // THE FIX: The array that actually holds the rows
  items: [lineItemSchema],

}, { timestamps: true });

export default mongoose.models.Bill || mongoose.model("Bill", billSchema);