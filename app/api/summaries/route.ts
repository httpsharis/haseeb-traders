import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import SummaryModel from "@/models/summaryModel";
import BillModel from "@/models/billModel";
import "@/models/clientModel";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStatus(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  if (message.includes("database dns lookup failed") || message.includes("querysrv") || message.includes("econnrefused")) {
    return 503;
  }
  return 500;
}

// ── GET /api/summaries ──────────────────────────────────
// Fetches all summaries for the main list screen
export async function GET() {
  try {
    await connectDB();

    const summaries = await SummaryModel.find()
      .populate("client", "name companyName")
      .sort({ createdAt: -1 });

    return NextResponse.json(summaries, { status: 200 });
  } catch (error) {
    console.error("Summary GET Error:", error);
    const message = getErrorMessage(error) || "Failed to fetch summaries";
    return NextResponse.json(
      { error: message },
      { status: getErrorStatus(error) }
    );
  }
}

// ── POST /api/summaries ─────────────────────────────────
// Creates a new master Summary and locks the selected bills
export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();

        // 1. Create the master Summary
        const newSummary = await SummaryModel.create(data);

        // 2. Lock the Bills: Change status and link them
        if (data.bills && data.bills.length > 0) {
            await BillModel.updateMany(
                { _id: { $in: data.bills } }, 
                { 
                    $set: { 
                        status: "Summarized",
                        summary: newSummary._id 
                    } 
                }
            );
        }

        return NextResponse.json(newSummary, { status: 201 });

    } catch (error) {
        console.error("Summary POST Error:", error);
        // THE FIX: Send the actual Mongoose validation error to the frontend!
      const message = getErrorMessage(error) || "Failed to save summary";
      return NextResponse.json({ error: message }, { status: getErrorStatus(error) });
    }
}