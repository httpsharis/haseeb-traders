import { NextResponse } from "next/server";
import ClientModel from "@/models/clientModel";
import { connectDB } from "@/config/db";

export async function GET() {
  try {
    await connectDB();

    const clients = await ClientModel.find({}).sort({ name: 1 });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json(
      { error: "Failed to load clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const newClient = await ClientModel.create(body);

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}