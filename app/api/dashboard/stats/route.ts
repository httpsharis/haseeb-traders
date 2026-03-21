import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { rateLimits } from "@/lib/rateLimit";
import SummaryModel from "@/models/SummaryModel";
import BillModel from "@/models/billModel";

/**
 * GET /api/dashboard/stats
 *
 * Returns simple counts for the dashboard metric cards.
 * Rate limited to 60 requests per minute (relaxed - read only).
 */
export async function GET(request: Request) {
  // Check rate limit first
  const rateLimitResponse = rateLimits.relaxed(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    // Count totals in parallel
    const [totalSummaries, totalBills] = await Promise.all([
      SummaryModel.countDocuments(),
      BillModel.countDocuments(),
    ]);

    return NextResponse.json({
      totalSummaries,
      totalBills,
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
