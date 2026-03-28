import mongoose from "mongoose";
import { IClient } from "@/types";

// ── Client Schema ───────────────────────────────────────
// Represents a client/customer entity. Clients are the top-level
// grouping — each Summary belongs to exactly one Client.
const clientSchema = new mongoose.Schema<IClient>({
  // Client / company name (e.g. "Govt. Boys High School Hala")
  name: { type: String, required: true, unique: true },
});

// Use existing model if already compiled (Next.js hot-reload safe)
const ClientModel =
  mongoose.models.Client || mongoose.model<IClient>("Client", clientSchema);

export default ClientModel;
