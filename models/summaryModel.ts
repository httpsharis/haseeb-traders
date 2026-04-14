import mongoose, { Schema } from "mongoose";
// Importing the new exact Type we built in Phase 1!
import { Summary } from "@/types"; 

// 1. Define the Tax sub-schema strictly
const summaryTaxSchema = new Schema({
    name: { type: String, required: true },
    percentage: { type: Number, required: true },
    target: { type: String, enum: ["BaseAmount", "SubtotalAmount"], default: "BaseAmount" },
    impact: { type: String, enum: ["Add", "DisplayOnly"], default: "Add" },
    amount: { type: Number, required: true, default: 0 } // <-- THIS IS CRITICAL
}, { _id: true }); // We keep _id here so React has a unique key for rows

// 2. The Master Ledger Schema
const summarySchema = new Schema({
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    summaryNumber: { type: String, required: true, unique: true },
    date: { type: Date },
    taxPeriod: { type: String, required: true },
    
    bills: [{ type: Schema.Types.ObjectId, ref: "Bill" }],

    // Separated Totals for Accurate Math
    totalBaseAmount: { type: Number, default: 0 }, 
    totalTaxAmount: { type: Number, default: 0 },  
    summarySubTotal: { type: Number, default: 0 }, 
    netPayable: { type: Number, default: 0 },

    // 3. Plug in the strict sub-schema here!
    summaryTaxes: [summaryTaxSchema],

    // Extra Business Logic Fields
    status: { type: String, enum: ["Draft", "Converted"], default: "Draft" },
    discount: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    dueDate: { type: Date },
    notes: { type: String },
}, { 
    timestamps: true 
});

const SummaryModel = mongoose.models.Summary || mongoose.model<Summary>("Summary", summarySchema);

export default SummaryModel;