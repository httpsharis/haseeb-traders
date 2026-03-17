import { NextResponse } from "next/server";
import BillModel from "@/models/billModel";
import { connectDB } from "@/config/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const bill = await BillModel.findById(id).populate("client");
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill, { status: 200 });
  } catch (error) {
    console.error("GET /api/bills/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}
