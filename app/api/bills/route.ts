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
        const payload = await req.json();

        if (!payload.status || payload.status !== "Draft") {
            payload.status = "Unbilled"; 
        }
        // THE UPSERT FIX: Check if the frontend sent an existing ID
        if (payload._id) {
            // Update the existing document
            const updatedBill = await BillModel.findByIdAndUpdate(
                payload._id, 
                payload, 
                { new: true } 
            );
            return NextResponse.json(updatedBill, { status: 200 });
        } else {
            // Create a brand new document
            delete payload._id; 
            const newBill = await BillModel.create(payload);
            return NextResponse.json(newBill, { status: 201 });
        }

    } catch (error: unknown) {
        console.error("DATABASE REJECTION:", error);
        
        // Strictly typed check for MongoDB duplicate key error
        if (typeof error === "object" && error !== null && "code" in error) {
            const dbError = error as { code: number };
            if (dbError.code === 11000) {
                 return NextResponse.json({ 
                     error: "Duplicate Error: This Invoice Number is already used." 
                 }, { status: 400 });
            }
        }

        const errorMessage = error instanceof Error ? error.message : "Failed to save bill";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}