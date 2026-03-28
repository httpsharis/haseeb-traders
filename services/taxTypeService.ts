import TaxTypeModel from "@/models/TaxTypeModel";
import { ITaxType } from "@/types";

// ── Get all tax types ───────────────────────────────────
// Returns all tax types, sorted alphabetically.
// Frontend uses this to populate the tax selection checkboxes.
export async function getTaxTypesService() {
  return await TaxTypeModel.find().sort({ name: 1 });
}

// ── Get only active tax types ───────────────────────────
// Used by the wizard UI — only shows enabled taxes.
export async function getActiveTaxTypesService() {
  return await TaxTypeModel.find({ isActive: true }).sort({ name: 1 });
}

// ── Create a new tax type ───────────────────────────────
export async function createTaxTypeService(data: Omit<ITaxType, "_id">) {
  const { name, percentage } = data;

  if (!name || percentage == null) {
    throw new Error("Tax type name and percentage are required.");
  }

  return await TaxTypeModel.create({
    name: name.trim(),
    percentage,
    isActive: data.isActive ?? true,
  });
}

// ── Update a tax type ───────────────────────────────────
export async function updateTaxTypeService(id: string, data: Partial<ITaxType>) {
  return await TaxTypeModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

// ── Delete a tax type ───────────────────────────────────
export async function deleteTaxTypeService(id: string) {
  return await TaxTypeModel.findByIdAndDelete(id);
}
