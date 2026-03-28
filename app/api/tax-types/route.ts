import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { createTaxTypeService, getTaxTypesService } from "@/services/taxTypeService";

// ── GET /api/tax-types ──────────────────────────────────
// Returns all tax types (active and inactive).
// Frontend uses this to build the tax selection UI.
export async function GET() {
  try {
    await connectDB();
    const taxTypes = await getTaxTypesService();
    return NextResponse.json(taxTypes, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/tax-types ─────────────────────────────────
// Creates a new tax type (e.g. when admin adds "ADC Fee" at 2%).
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newTaxType = await createTaxTypeService(body);
    return NextResponse.json(newTaxType, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
