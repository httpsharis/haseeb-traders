import mongoose from "mongoose";
import { IBill } from "@/types";

const billItemSchema = new mongoose.Schema({
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
    required:
      true, default: 1
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

const billSchema = new mongoose.Schema({
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
  items: [billItemSchema], // This holds your table rows
}, { timestamps: true });

const BillModel =
  mongoose.models.Bill || mongoose.model<IBill>("Bill", billSchema);

export default BillModel;
