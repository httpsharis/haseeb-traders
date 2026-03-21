import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { rateLimits } from "@/lib/rateLimit";
import BillModel from "@/models/billModel";
import SummaryModel from "@/models/SummaryModel";
// Required for populate to work - registers the Client model with Mongoose
import "@/models/clientModel";

/**
 * GET /api/dashboard/recent
 *
 * Fetches recent bills and summaries with separate pagination for each.
 *
 * Query params:
 *   - billsPage: Page number for bills (default: 1)
 *   - summariesPage: Page number for summaries (default: 1)
 *   - limit: Items per page (default: 5, max: 20)
 *
 * Rate limited to 60 requests per minute.
 */
export async function GET(request: Request) {
  const rateLimitResponse = rateLimits.relaxed(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await connectDB();

    // Parse separate pagination params for bills and summaries
    const { searchParams } = new URL(request.url);
    const billsPage = Math.max(1, parseInt(searchParams.get("billsPage") || "1", 10));
    const summariesPage = Math.max(1, parseInt(searchParams.get("summariesPage") || "1", 10));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "5", 10)));

    const billsSkip = (billsPage - 1) * limit;
    const summariesSkip = (summariesPage - 1) * limit;

    // Fetch data with separate pagination in parallel
    const [recentBills, recentSummaries, totalBills, totalSummaries] = await Promise.all([
      // Get paginated bills
      BillModel.find()
        .sort({ createdAt: -1 })
        .skip(billsSkip)
        .limit(limit)
        .populate({
          path: "summary",
          select: "_id client",
          populate: {
            path: "client",
            select: "name",
          },
        })
        .lean(),

      // Get paginated summaries
      SummaryModel.find()
        .sort({ createdAt: -1 })
        .skip(summariesSkip)
        .limit(limit)
        .populate("client", "name")
        .lean(),

      // Get total counts
      BillModel.countDocuments(),
      SummaryModel.countDocuments(),
    ]);

    // Calculate bill counts for displayed summaries
    const summaryIds = recentSummaries.map((s) => s._id);
    const billCountsArray = await BillModel.aggregate([
      { $match: { summary: { $in: summaryIds } } },
      { $group: { _id: "$summary", count: { $sum: 1 } } },
    ]);

    const billCounts: Record<string, number> = {};
    billCountsArray.forEach((item) => {
      billCounts[item._id.toString()] = item.count;
    });

    return NextResponse.json({
      bills: recentBills,
      summaries: recentSummaries,
      billCounts,
      pagination: {
        billsPage,
        summariesPage,
        limit,
        totalBills,
        totalSummaries,
        totalBillPages: Math.ceil(totalBills / limit),
        totalSummaryPages: Math.ceil(totalSummaries / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
