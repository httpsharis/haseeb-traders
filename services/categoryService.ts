import CategoryModel from "@/models/categoryModel";
import { Category } from "@/types"; 

// ── Get all categories ──────────────────────────────────
// Returns all categories, sorted alphabetically.
export async function getCategoriesService() {
  return await CategoryModel.find().sort({ name: 1 });
}

// ── Get only active categories ──────────────────────────
// Used by the bill form — only shows enabled categories in the dropdown.
export async function getActiveCategoriesService() {
  return await CategoryModel.find({ isActive: true }).sort({ name: 1 });
}

// ── Create a new category ───────────────────────────────
// Called when the user presses the "+" button on the category dropdown.
export async function createCategoryService(data: Partial<Category>) {
  const { name, description, isActive } = data; // <-- Now capturing description!

  if (!name) {
    throw new Error("Category name is required.");
  }

  return await CategoryModel.create({
    name: name.trim(),
    description: description?.trim(), // Safely trim if it exists
    isActive: isActive ?? true,
  });
}

// ── Update a category ───────────────────────────────────
export async function updateCategoryService(id: string, data: Partial<Category>) {
  return await CategoryModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

// ── Delete a category ───────────────────────────────────
export async function deleteCategoryService(id: string) {
  return await CategoryModel.findByIdAndDelete(id);
}