import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import {
  createSummaryService,
  getSummariesService,
} from "@/services/SummaryService";

// ── GET /api/summaries ──────────────────────────────────
// Returns paginated summaries with search, filter, and date range support.
//
// Query params:
//   search    — text search on client name or summary number
//   status    — filter by "Draft" or "Converted"
//   startDate — date range start (ISO string)
//   endDate   — date range end (ISO string)
//   page      — page number (default 1)
//   limit     — items per page (default 10, max 100)
//
// Example: GET /api/summaries?search=school&status=Draft&page=1&limit=10
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const result = await getSummariesService({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 10,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/summaries ─────────────────────────────────
// Creates a new Summary and all its Bills in one request.
// This is the ONLY entry point for creating bills.
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    console.log("POST /api/summaries - Body received:", JSON.stringify(body, null, 2));

    const newSummary = await createSummaryService(body);
    return NextResponse.json(newSummary, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log("POST /api/summaries - Error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
