import ClientModel from "@/models/clientModel";
import { IClient } from "@/types";

// ── Query params for client search/pagination ───────────
export interface ClientQueryParams {
  search?: string;  // Text search on client name
  page?: number;    // Page number (1-indexed, default 1)
  limit?: number;   // Items per page (default 10, max 100)
}

// ── Update a client ─────────────────────────────────────
export async function updateClientService(id: string, body: Partial<IClient>) {
  return await ClientModel.findByIdAndUpdate(id, body, { new: true });
}

// ── Delete a client ─────────────────────────────────────
export async function deleteClientService(id: string) {
  return await ClientModel.findByIdAndDelete(id);
}

// ── Get all clients with search + pagination ────────────
// Query examples:
//   GET /api/clients?search=school&page=1&limit=20
export async function getClientsService(params: ClientQueryParams = {}) {
  const {
    search,
    page = 1,
    limit = 10,
  } = params;

  // Clamp limit to a safe range
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * safeLimit;

  // Build filter — case-insensitive name search
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (search) {
    filter.name = new RegExp(search, "i");
  }

  // Execute query with pagination
  const [data, total] = await Promise.all([
    ClientModel.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(safeLimit),
    ClientModel.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page: Math.max(page, 1),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

// ── Create a new client ─────────────────────────────────
export async function createClientService(data: IClient) {
  return await ClientModel.create(data);
}

// ── Get a single client by ID ───────────────────────────
export async function getSingleClientService(id: string) {
  return await ClientModel.findById(id);
}