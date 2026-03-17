import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getClientsService, createClientService } from "@/services/clientService";

export async function GET() {
  try {
    await connectDB();
    const clients = await getClientsService();
    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newClient = await createClientService(body);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}