import mongoose from "mongoose";
import { ISummary } from "@/types";

// ── Summary Schema ──────────────────────────────────────
// The Summary is the master "parent folder".
// It groups multiple Bills under one client and tax period.
const summarySchema = new mongoose.Schema({
  // Reference to the Client this summary belongs to
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  // Unique identifier for this summary (e.g. "6")
  summaryNumber: {
    type: String,
    required: true,
    unique: true,
  },
  // Date of the summary
  date: {
    type: Date,
  },
  // The tax period this summary covers (e.g. "Mar 2025")
  taxPeriod: {
    type: String,
    required: true,
  },
  // Lifecycle status of the summary
  status: {
    type: String,
    enum: ["Draft", "Converted"],
    default: "Draft",
  },
  // Optional discount amount applied to the summary total
  discount: {
    type: Number,
    default: 0,
  },
  // Optional commission amount
  commission: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Use existing model if already compiled (Next.js hot-reload safe)
const SummaryModel =
  mongoose.models.Summary || mongoose.model<ISummary>("Summary", summarySchema);

export default SummaryModel;
