import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import BillModel from "@/models/billModel";
import "@/models/clientModel";
import { createBillService, updateBillService } from "@/services/billService";

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
        const payload = await req.json();

        if (!payload.status || payload.status !== "Draft") {
            payload.status = "Unbilled"; 
        }
        // THE UPSERT FIX: Check if the frontend sent an existing ID
        if (payload._id) {
            // Update the existing document using the service to trigger the math engine
            const updatedBill = await updateBillService(payload._id, payload);
            return NextResponse.json(updatedBill, { status: 200 });
        } else {
            // Create a brand new document using the service to trigger the math engine
            delete payload._id; 
            const newBill = await createBillService(payload);
            return NextResponse.json(newBill, { status: 201 });
        }

    } catch (error: unknown) {
        console.error("DATABASE REJECTION:", error);
        
        // Strictly typed check for MongoDB errors
        if (typeof error === "object" && error !== null) {
            const errObj = error as Record<string, unknown>;
            
            if (errObj.code === 11000) {
                 return NextResponse.json({ 
                     error: "Duplicate Error: This Invoice Number is already used." 
                 }, { status: 400 });
            }

            if (errObj.name === "ValidationError") {
                 return NextResponse.json({ 
                     error: errObj.message 
                 }, { status: 400 });
            }
        }

        const errorMessage = error instanceof Error ? error.message : "Failed to save bill";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}