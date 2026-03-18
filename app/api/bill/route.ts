import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { createInvoiceService, getInvoicesService } from "@/services/InvoiceService";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // The service handles all the hard work now
    const newInvoice = await createInvoiceService(body);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await connectDB();

    const invoices = await getInvoicesService();

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Server failed to load invoices." },
      { status: 500 }
    );
  }
}