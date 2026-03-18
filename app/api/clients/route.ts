import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getClientsService, createClientService } from "@/services/clientService";

// ── GET /api/clients ────────────────────────────────────
// Returns paginated clients with optional name search.
//
// Query params:
//   search — text search on client name
//   page   — page number (default 1)
//   limit  — items per page (default 10, max 100)
//
// Example: GET /api/clients?search=school&page=1&limit=20
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const result = await getClientsService({
      search: searchParams.get("search") || undefined,
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 10,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/clients ───────────────────────────────────
// Creates a new client.
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