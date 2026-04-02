import mongoose, { Schema } from "mongoose";
import { ISummary } from "@/types";

const summaryTaxesSchema = new Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const summarySchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  summaryNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
  },
  taxPeriod: {
    type: String,
    required: true,
  },
  bills: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Bill" 
  }],
  
  // NEW: Separated Totals for Accurate Math
  totalBaseAmount: { type: Number, default: 0 }, // Sum of all raw bill bases (No GST)
  totalTaxAmount: { type: Number, default: 0 },  // Sum of all bill GSTs
  summarySubTotal: { type: Number, default: 0 }, // Base + GST combined
  
  summaryTaxes: [summaryTaxesSchema], // These now calculate against totalBaseAmount
  netPayable: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ["Draft", "Converted"],
    default: "Draft",
  },
  discount: {
    type: Number,
    default: 0,
  },
  commission: {
    type: Number,
    default: 0,
  },
  dueDate: { type: Date }, 
  notes: { type: String },
}, { timestamps: true });

const SummaryModel = mongoose.models.Summary || mongoose.model<ISummary>("Summary", summarySchema);

export default SummaryModel;