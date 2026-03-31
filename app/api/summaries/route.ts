import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { 
    createSummaryService, 
    getSummariesService, 
    updateSummaryService 
} from "@/services/summaryService";
import { deleteBillsBySummaryService } from "@/services/billService";
import BillModel from "@/models/billModel";
import SummaryModel from "@/models/summaryModel";

// This interface fixes the ESLint "any" error!
interface IBillPayload {
    billNumber: string;
    date?: string | Date;
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
    taxes?: unknown[];
}

// ── GET /api/summaries ──────────────────────────────────
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
export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();

        // 1. If we have an ID, try to update the existing record
        if (data._id) {
            const updatedSummary = await updateSummaryService(data._id, data);

            if (updatedSummary) {
                if (data.bills && Array.isArray(data.bills)) {
                    await deleteBillsBySummaryService(data._id);
                    
                    // Notice we use IBillPayload here instead of 'any'
                    const billDocs = data.bills.map((item: IBillPayload) => ({
                        summary: data._id,
                        billNumber: item.billNumber,
                        date: item.date ? new Date(item.date) : undefined,
                        description: item.description,
                        category: item.category,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxes: item.taxes || [],
                    }));
                    await BillModel.insertMany(billDocs);
                }
                return NextResponse.json(updatedSummary, { status: 200 });
            }
            
            // Delete bad ID if it belonged to a Bill instead of a Summary
            delete data._id; 
        }

        // 2. Fallback check: Force update if summaryNumber already exists
        if (data.summaryNumber) {
             const existingDoc = await SummaryModel.findOne({ summaryNumber: data.summaryNumber });
             
             if (existingDoc) {
                 const forcedUpdate = await updateSummaryService(existingDoc._id, data);
                 
                 if (data.bills && Array.isArray(data.bills)) {
                    await deleteBillsBySummaryService(existingDoc._id);
                    
                    const billDocs = data.bills.map((item: IBillPayload) => ({
                        summary: existingDoc._id,
                        billNumber: item.billNumber,
                        date: item.date ? new Date(item.date) : undefined,
                        description: item.description,
                        category: item.category,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxes: item.taxes || [],
                    }));
                    await BillModel.insertMany(billDocs);
                 }
                 return NextResponse.json(forcedUpdate, { status: 200 });
             }
        }

        // 3. Create brand new Summary + Line Items
        const newSummary = await createSummaryService(data);
        return NextResponse.json(newSummary, { status: 201 });

    } catch (error: unknown) {
        console.error("Summary POST Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to save summary";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}