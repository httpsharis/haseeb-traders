import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import {
  deleteSummaryService,
  getSingleSummaryService,
  updateSummaryService,
} from "@/services/SummaryService";

// ── GET /api/summaries/:id ──────────────────────────────
// Returns a single summary with its populated client and all linked bills.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const result = await getSingleSummaryService(id);

    if (!result) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PUT /api/summaries/:id ──────────────────────────────
// Updates summary-level fields (client, summaryNumber, taxPeriod, status).
// Bills are managed separately via /api/bills/:id.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updatedSummary = await updateSummaryService(id, body);

    if (!updatedSummary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSummary, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ── DELETE /api/summaries/:id ───────────────────────────
// Deletes a summary and cascade-deletes all its linked bills.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedSummary = await deleteSummaryService(id);

    if (!deletedSummary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Summary deleted" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
