import mongoose from "mongoose";
import SummaryModel from "@/models/summaryModel";
import BillModel from "@/models/billModel";
import ClientModel from "@/models/clientModel";
import { CreateSummaryPayload, IBill, ISummary } from "@/types";
import { deleteBillsBySummaryService } from "./billService";

// ── Query params interface for search/filter/pagination ─
export interface SummaryQueryParams {
  search?: string;    // Text search: client name or summary number
  status?: string;    // Filter by status: "Draft", "Converted"
  startDate?: string; // Date range start (ISO string)
  endDate?: string;   // Date range end (ISO string)
  page?: number;      // Page number (1-indexed, default 1)
  limit?: number;     // Items per page (default 10, max 100)
}

// ── Create ──────────────────────────────────────────────
// Creates a Summary and all its Bills in one operation.
// This is the ONLY way to create bills — never standalone.
export async function createSummaryService(body: ISummary) {
  const { client, summaryNumber, date, taxPeriod, status, discount, commission, bills } = body;

  // Validate required fields
  if (!client || !summaryNumber) {
    throw new Error(
      `Missing required fields. Got: client=${client}, summaryNumber=${summaryNumber}`
    );
  }

  // 1. Create the parent Summary document
  const newSummary = await SummaryModel.create({
    client,
    summaryNumber,
    date: date ? new Date(date) : undefined,
    taxPeriod,
    status: status || "Draft",
    discount: discount || 0,
    commission: commission || 0,
  });

  // 2. Bulk-create all child Bill documents, linking each to the new Summary
  if (bills && bills.length > 0) {
    const billDocs = bills.map((item: IBill) => ({
      summary: newSummary._id,
      billNumber: item.billNumber,
      date: item.date ? new Date(item.date) : undefined,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxes: item.taxes || [],
    }));

    await BillModel.insertMany(billDocs);
  }

  return newSummary;
}

// ── Read (All) with Search, Filter, Pagination ──────────
// Supports: text search, status filter, date range, pagination.
//
// Query examples:
//   GET /api/summaries?search=school&status=Draft&page=1&limit=10
//   GET /api/summaries?startDate=2025-01-01&endDate=2025-03-31
export async function getSummariesService(params: SummaryQueryParams = {}) {
  const {
    search,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = params;

  // Clamp limit to a safe range
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * safeLimit;

  // ── Build the filter object ───────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  // Text search: match client name OR summary number
  // For client name, we first find matching client IDs, then filter by them.
  if (search) {
    const searchRegex = new RegExp(search, "i");

    // Find clients whose name matches the search term
    const matchingClients = await ClientModel.find(
      { name: searchRegex },
      { _id: 1 }
    );
    const clientIds = matchingClients.map((c) => c._id);

    // Match either client name OR summaryNumber
    filter.$or = [
      { client: { $in: clientIds } },
      { summaryNumber: searchRegex },
    ];
  }

  // Status filter: exact match
  if (status) {
    filter.status = status;
  }

  // Date range filter: between startDate and endDate (inclusive)
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  // ── Execute query with pagination ─────────────────────
  const [data, total] = await Promise.all([
    SummaryModel.find(filter)
      .populate("client", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    SummaryModel.countDocuments(filter),
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

// ── Read (Single) ───────────────────────────────────────
// Fetches a single summary and all its linked bills.
export async function getSingleSummaryService(id: string) {
  // 1. Fetch the parent summary with populated client
  const summary = await SummaryModel.findById(id).populate("client", "name");

  if (!summary) throw new Error("Summary not found.");

  // 2. Fetch all child bills linked to this summary
  const bills = await BillModel.find({ summary: id });

  // 3. Return them together
  return { summary, bills };
}

// ── Update ──────────────────────────────────────────────
// Updates summary-level fields (not bills — those are managed separately).
export async function updateSummaryService(
  id: string,
  data: Partial<CreateSummaryPayload>
) {
  const { client, date, ...rest } = data;

  const updateData: Partial<ISummary> & { client?: string } = { ...rest };

  // Validate client ID format if provided
  if (client) {
    if (!mongoose.Types.ObjectId.isValid(client)) {
      throw new Error("Invalid client ID format.");
    }
    updateData.client = client;
  }

  // Parse date if provided
  if (date) {
    updateData.date = new Date(date);
  }

  return await SummaryModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
}

// ── Delete ──────────────────────────────────────────────
// Deletes a summary AND all its linked bills (cascade delete).
export async function deleteSummaryService(id: string) {
  await deleteBillsBySummaryService(id);
  return await SummaryModel.findByIdAndDelete(id);
}
