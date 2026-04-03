import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getSingleSummaryService } from "@/services/summaryService";
import SummaryModel from "@/models/summaryModel";
import BillModel from "@/models/billModel";
import "@/models/clientModel";

// ── GET /api/summaries/:id ──────────────────────────────
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
export async function PUT(
    req: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const data = await req.json();
        
        // Await the params to fix the Next.js routing error
        const { id: summaryId } = await params;

        const oldSummary = await SummaryModel.findById(summaryId);
        if (!oldSummary) throw new Error("Summary not found");

        const oldBillIds = oldSummary.bills.map((id: { toString: () => string }) => id.toString());
        const newBillIds = data.bills || [];

        // Release unchecked bills back to "Unbilled"
        const billsToRelease = oldBillIds.filter((id: string) => !newBillIds.includes(id));
        if (billsToRelease.length > 0) {
            await BillModel.updateMany(
                { _id: { $in: billsToRelease } },
                { $set: { status: "Unbilled" }, $unset: { summary: 1 } }
            );
        }

        // Claim newly checked bills
        const billsToClaim = newBillIds.filter((id: string) => !oldBillIds.includes(id));
        if (billsToClaim.length > 0) {
            await BillModel.updateMany(
                { _id: { $in: billsToClaim } },
                { $set: { status: "Summarized", summary: summaryId } }
            );
        }

        // Update the master summary document
        const updatedSummary = await SummaryModel.findByIdAndUpdate(summaryId, data, { new: true });

        return NextResponse.json(updatedSummary, { status: 200 });

    } catch (error: unknown) {
        console.error("Summary PUT Error:", error);
        return NextResponse.json({ error: "Failed to update summary" }, { status: 500 });
    }
}

// ── DELETE /api/summaries/:id ───────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const summary = await SummaryModel.findById(id);
    if (!summary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }

    // CRITICAL FIX: Release the bills, do not delete them!
    if (summary.bills && summary.bills.length > 0) {
        await BillModel.updateMany(
            { _id: { $in: summary.bills } },
            { $set: { status: "Unbilled" }, $unset: { summary: 1 } }
        );
    }

    // Now it is safe to delete the empty summary folder
    await SummaryModel.findByIdAndDelete(id);

    return NextResponse.json({ message: "Summary deleted and bills safely released" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}