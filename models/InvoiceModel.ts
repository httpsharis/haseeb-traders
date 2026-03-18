import mongoose from "mongoose";
import { IInvoice } from "@/types";

const taxChargeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  baseAmount: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
});

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  gstPercentage: {
    type: Number,
    required: true,
    default: 18
  }, // Added GST
});

const invoiceSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true
  },
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  taxPeriod: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["draft", "converted"],
    default: "draft"
  },
  items: [invoiceItemSchema],
  taxes: [taxChargeSchema],// This holds your table rows
}, { timestamps: true });

const InvoiceModel =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", invoiceSchema);

export default InvoiceModel;
