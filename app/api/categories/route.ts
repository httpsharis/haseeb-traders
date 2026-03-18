import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { createCategoryService, getCategoriesService } from "@/services/CategoryService";

// ── GET /api/categories ─────────────────────────────────
// Returns all categories for the bill form dropdown.
export async function GET() {
  try {
    await connectDB();
    const categories = await getCategoriesService();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/categories ────────────────────────────────
// Creates a new category (called when user presses "+" on the dropdown).
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newCategory = await createCategoryService(body);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
