import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getBillsBySummaryService } from "@/services/BillService";

// ── GET /api/bills?summaryId=xxx ────────────────────────
// Returns all bills for a given summary.
// The summaryId query parameter is required.
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const summaryId = searchParams.get("summaryId");

    if (!summaryId) {
      return NextResponse.json(
        { error: "summaryId query param is required" },
        { status: 400 }
      );
    }

    const bills = await getBillsBySummaryService(summaryId);
    return NextResponse.json(bills, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// NOTE: POST is intentionally removed.
// Bills are only created via POST /api/summaries (together with their parent).
