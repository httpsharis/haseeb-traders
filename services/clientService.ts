import ClientModel from "@/models/clientModel";
import { Client } from "@/types"; 

// ── Query params for client search/pagination ───────────
export interface ClientQueryParams {
  search?: string;  // Text search on client name
  page?: number;    // Page number (1-indexed, default 1)
  limit?: number;   // Items per page (default 10, max 100)
}

// ── Update a client ─────────────────────────────────────
export async function updateClientService(id: string, body: Partial<Client>) {
  return await ClientModel.findByIdAndUpdate(id, body, { 
      new: true,
      runValidators: true // Enforces Mongoose schema rules on update
  });
}

// ── Delete a client ─────────────────────────────────────
export async function deleteClientService(id: string) {
  return await ClientModel.findByIdAndDelete(id);
}

// ── Get all clients with search + pagination ────────────
export async function getClientsService(params: ClientQueryParams = {}) {
  const {
    search,
    page = 1,
    limit = 10,
  } = params;

  // Ensure limit is at least 1, but remove the artificial cap
  const safeLimit = Math.max(limit, 1);
  const skip = (Math.max(page, 1) - 1) * safeLimit;

  // Build filter — case-insensitive name search
  // Cleaned up the 'any' type for strict TypeScript safety
  const filter: Record<string, unknown> = {};
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
export async function createClientService(data: Partial<Client>) {
  if (!data.name) {
      throw new Error("Client name is required.");
  }
  try {
    return await ClientModel.create(data);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new Error("A client with this name already exists.");
    }
    throw error;
  }
}

// ── Get a single client by ID ───────────────────────────
export async function getSingleClientService(id: string) {
  return await ClientModel.findById(id);
}