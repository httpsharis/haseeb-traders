import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import ClientModel from "@/models/clientModel";
import SummaryModel from "@/models/summaryModel";
import BillModel from "@/models/billModel";

// ── GET /api/search?q=<query> ───────────────────────────
// Universal search across clients, summaries, and bills.
// Returns grouped results with max 5 per category.
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ clients: [], summaries: [], bills: [] });
    }

    const regex = new RegExp(q, "i");

    // Search clients by name
    const clients = await ClientModel.find({ name: regex })
      .select("name")
      .limit(5)
      .lean();

    // Search summaries by summaryNumber, taxPeriod, or matching client name
    const matchingClientIds = await ClientModel.find({ name: regex }, { _id: 1 }).lean();
    const clientIds = matchingClientIds.map((c) => c._id);

    const summaries = await SummaryModel.find({
      $or: [
        { summaryNumber: regex },
        { taxPeriod: regex },
        { client: { $in: clientIds } },
      ],
    })
      .populate("client", "name")
      .select("summaryNumber taxPeriod status date client")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Search bills by description, billNumber, or category
    const bills = await BillModel.find({
      $or: [
        { description: regex },
        { billNumber: regex },
        { category: regex },
      ],
    })
      .populate({
        path: "summary",
        select: "summaryNumber client status",
        populate: { path: "client", select: "name" },
      })
      .select("description billNumber category quantity unitPrice summary")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({ clients, summaries, bills });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
