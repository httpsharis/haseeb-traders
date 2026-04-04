import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import BillModel from "@/models/billModel";
import "@/models/clientModel";

// 1. FORCE NEXT.JS TO NEVER CACHE THIS ROUTE (Crucial for App Router)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── GET /api/bills ──────────────────────────────────
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("clientId");
        const status = searchParams.get("status");

        const query: Record<string, string> = {};
        
        if (clientId) query.client = clientId;
        if (status) query.status = status;

        // Force fetch EVERYTHING matching the client
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
export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();

        // Force every saved item back to the inbox
        data.status = "Unbilled"; 

        // THE OVERWRITE FIX:
        // If your "Create Bill" form accidentally sends an old _id or billNumber,
        // we forcefully delete them from the payload so MongoDB has no choice 
        // but to create a brand new, unique row every single time.
        delete data._id;
        
        // Note: If you ACTUALLY want to edit/update bills later, you will need 
        // to put the `findByIdAndUpdate` logic back here, but for now, this 
        // forces the creation of new bills so you can see them all!
        const newBill = await BillModel.create(data);
        return NextResponse.json(newBill, { status: 201 });

    } catch (error: unknown) {
        console.error("Bill POST Error:", error);
        return NextResponse.json({ error: "Failed to save bill" }, { status: 500 });
    }
}