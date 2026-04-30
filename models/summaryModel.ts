import { Summary } from "@/types";
import mongoose, { Schema } from "mongoose";

const summaryTaxSchema = new Schema({
    name: { type: String, required: true },
    percentage: { type: Number, required: true },
    target: { type: String, enum: ["BaseAmount", "SubtotalAmount"], default: "BaseAmount" },
    impact: { type: String, enum: ["Add", "DisplayOnly"], default: "Add" },
    amount: { type: Number, required: true, default: 0 } 
}, { _id: true }); 

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
    
    // ✅ THE VIP PASS: Tell Mongoose this field is allowed!
    amount: { type: Number, default: 0 },

    summaryTaxes: [summaryTaxSchema],

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