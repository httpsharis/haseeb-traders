import mongoose, { Schema } from "mongoose";
import { Client } from "@/types";
// ── Client Schema ───────────────────────────────────────
// Represents a client/customer entity. Clients are the top-level
// grouping — each Summary belongs to exactly one Client.
const clientSchema = new Schema({
    // Client / company name (e.g. "Govt. Boys High School Hala")
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    companyName: { 
        type: String,
        trim: true
    },
    email: { 
        type: String,
        trim: true,
        lowercase: true
    },
    phone: { 
        type: String,
        trim: true
    },
    address: { 
        type: String,
        trim: true
    }
}, { 
    timestamps: true 
});

// Use existing model if already compiled (Next.js hot-reload safe)
const ClientModel = mongoose.models.Client || mongoose.model<Client>("Client", clientSchema);

export default ClientModel;