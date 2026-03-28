import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { updateCategoryService, deleteCategoryService } from "@/services/categoryService";

// ── PUT /api/categories/:id ─────────────────────────────
// Updates a category (e.g. rename or toggle active status).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updated = await updateCategoryService(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ── DELETE /api/categories/:id ──────────────────────────
// Deletes a category permanently.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await deleteCategoryService(id);

    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
