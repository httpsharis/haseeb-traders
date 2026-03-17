import mongoose from "mongoose";
import { IClient } from "@/types";

const clientSchema = new mongoose.Schema<IClient>({
  name: { type: String, required: true, unique: true },
});

const ClientModel =
  mongoose.models.Client || mongoose.model<IClient>("Client", clientSchema);

export default ClientModel;
