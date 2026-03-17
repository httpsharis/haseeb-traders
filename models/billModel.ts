import mongoose from "mongoose";
import { IBill } from "@/types";

const billSchema = new mongoose.Schema<IBill>({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  billNumber: { type: String, required: true },
  date: { type: Date, required: true },
  taxPeriod: { type: String, required: true },
  status: { type: String, default: "draft" },
});

const BillModel =
  mongoose.models.Bill || mongoose.model<IBill>("Bill", billSchema);

export default BillModel;
