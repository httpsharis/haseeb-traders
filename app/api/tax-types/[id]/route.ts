import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { updateTaxTypeService, deleteTaxTypeService } from "@/services/TaxTypeService";

// ── PUT /api/tax-types/:id ──────────────────────────────
// Updates a tax type (e.g. change GST from 18% to 17%).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updated = await updateTaxTypeService(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Tax type not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ── DELETE /api/tax-types/:id ───────────────────────────
// Deletes a tax type permanently.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await deleteTaxTypeService(id);

    if (!deleted) {
      return NextResponse.json({ error: "Tax type not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Tax type deleted" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
