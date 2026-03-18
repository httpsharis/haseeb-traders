import mongoose from "mongoose";
import { ICategory } from "@/types";

// ── Category Schema ─────────────────────────────────────
// User-managed bill categories. The frontend shows these in a
// dropdown with a "+" button to add new ones on the fly.
const categorySchema = new mongoose.Schema({
  // Category name (e.g. "Textiles", "Accessories", "Building Materials")
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // Soft toggle — inactive categories won't appear in dropdowns
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Use existing model if already compiled (Next.js hot-reload safe)
const CategoryModel =
  mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);

export default CategoryModel;
