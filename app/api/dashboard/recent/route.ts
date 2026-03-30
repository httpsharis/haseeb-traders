import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { rateLimits } from "@/lib/rateLimit";
import BillModel from "@/models/billModel";
import SummaryModel from "@/models/summaryModel";
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
    // Calculate pagination for Invoices (Summaries)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [recentSummaries, totalSummaries] = await Promise.all([
      SummaryModel.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { // Join with clients to get the client name
          $lookup: {
            from: "clients",
            localField: "client",
            foreignField: "_id",
            as: "clientDetails"
          }
        },
        { $unwind: { path: "$clientDetails", preserveNullAndEmptyArrays: true } },
        { // Join with bills to calculate the sum
          $lookup: {
            from: "bills",
            localField: "_id",
            foreignField: "summary",
            as: "bills"
          }
        },
        { // Calculate total amount by multiplying quantity and unitPrice for each bill, then summing
          $addFields: {
            clientName: "$clientDetails.name",
            totalAmount: {
              $sum: {
                $map: {
                  input: "$bills",
                  as: "b",
                  in: { $multiply: ["$$b.quantity", "$$b.unitPrice"] }
                }
              }
            }
          }
        },
        { // Exclude unneeded bulk data
          $project: {
            bills: 0,
            clientDetails: 0
          }
        }
      ]),
      SummaryModel.countDocuments(),
    ]);

    return NextResponse.json({
      summaries: recentSummaries,
      pagination: {
        page,
        limit,
        totalSummaries,
        totalPages: Math.ceil(totalSummaries / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
