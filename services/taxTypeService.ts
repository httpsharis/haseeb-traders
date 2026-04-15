import TaxTypeModel from "@/models/taxTypeModel";
import { TaxRule } from "@/types"; 

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
// We strictly define that 'isActive' might be passed alongside normal TaxRule data
export async function createTaxTypeService(data: Partial<TaxRule> & { isActive?: boolean }) {
  const { name, percentage, target, impact, status, isActive } = data;

  if (!name || percentage == null) {
    throw new Error("Tax type name and percentage are required.");
  }

  return await TaxTypeModel.create({
    name: name.trim(),
    percentage: Number(percentage),
    
    // --- Injecting the Math Engine Rules ---
    target: target || "BaseAmount",
    impact: impact || "Add",
    
    // Clean, strict fallback logic without using 'any'
    isActive: isActive ?? (status !== false && status !== "false"),
  });
}

// ── Update a tax type ───────────────────────────────────
export async function updateTaxTypeService(id: string, data: Partial<TaxRule> & { isActive?: boolean }) {
  return await TaxTypeModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

// ── Delete a tax type ───────────────────────────────────
export async function deleteTaxTypeService(id: string) {
  return await TaxTypeModel.findByIdAndDelete(id);
}