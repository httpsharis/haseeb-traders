import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import BillModel from "@/models/billModel";
import "@/models/clientModel";

// ── GET /api/bills ──────────────────────────────────
// Fetches pending bills for a specific client.
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("clientId");
        const status = searchParams.get("status");

        // Strict TypeScript fixes applied here
        const query: Record<string, string> = {};
        
        if (clientId) query.client = clientId;
        if (status) query.status = status;

        const bills = await BillModel.find(query)
            .populate("client", "name companyName") 
            .sort({ date: -1 });

        return NextResponse.json(bills, { status: 200 });

    } catch (error: unknown) {
        console.error("Bill GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
    }
}

// ── POST /api/bills ─────────────────────────────────
// Creates a standalone Bill waiting to be summarized.
// ── POST /api/bills ─────────────────────────────────
export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();

        // CRITICAL FIX: Force every saved wizard item back to the inbox
        data.status = "Unbilled"; 

        // 1. Update if ID exists
        if (data._id) {
            const updated = await BillModel.findByIdAndUpdate(
                data._id, 
                data, 
                { returnDocument: "after" } // Fixed Mongoose warning
            );
            return NextResponse.json(updated, { status: 200 });
        }

        // 2. Update if Bill Number exists
        if (data.billNumber) {
             const existing = await BillModel.findOne({ billNumber: data.billNumber });
             if (existing) {
                 const updated = await BillModel.findByIdAndUpdate(
                     existing._id, 
                     data, 
                     { returnDocument: "after" } // Fixed Mongoose warning
                 );
                 return NextResponse.json(updated, { status: 200 });
             }
        }

        // 3. Create brand new standalone Bill
        const newBill = await BillModel.create(data);
        return NextResponse.json(newBill, { status: 201 });

    } catch (error: unknown) {
        console.error("Bill POST Error:", error);
        return NextResponse.json({ error: "Failed to save bill" }, { status: 500 });
    }
}