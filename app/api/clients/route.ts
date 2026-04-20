import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { getClientsService, createClientService } from "@/services/clientService";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStatus(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  if (message.includes("database dns lookup failed") || message.includes("querysrv") || message.includes("econnrefused")) {
    return 503;
  }
  return 500;
}

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
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: getErrorStatus(error) });
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
    const message = getErrorMessage(error);
    if (message.toLowerCase().includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: getErrorStatus(error) });
  }
}