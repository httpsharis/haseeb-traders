import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { createBillService, getBillsService } from "@/services/billService";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // The service handles all the hard work now
    const newBill = await createBillService(body);

    return NextResponse.json(newBill, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectDB();

    const bills = await getBillsService();

    return NextResponse.json(bills);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Server failed to load bills." },
      { status: 500 }
    );
  }
}