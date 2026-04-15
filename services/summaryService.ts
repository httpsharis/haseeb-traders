import SummaryModel from "@/models/summaryModel";
import BillModel from "@/models/billModel";
import ClientModel from "@/models/clientModel";
import { Summary } from "@/types";

// ── Strict Interfaces to silence TypeScript Errors ──────
export interface SummaryQueryParams {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

// Extends the standard Summary to include frontend-specific payload data
export interface CreateSummaryInput extends Partial<Summary> {
    billsToLock?: string[];
    totalBaseAmount?: number;
    discount?: number;
    commission?: number;
    notes?: string;
    dueDate?: string | Date;
}

// Defines exactly what the MongoDB search filter looks like
interface MongoFilter {
    $or?: Array<{ client: { $in: unknown[] } } | { summaryNumber: RegExp }>;
    status?: string;
    date?: { $gte?: Date; $lte?: Date };
}

// ── Create ──────────────────────────────────────────────
export async function createSummaryService(body: CreateSummaryInput) {
    const { 
        client, summaryNumber, date, taxPeriod, status, billsToLock, 
        summaryTaxes, totalBaseAmount, totalTaxAmount, summarySubTotal, netPayable,
        discount, commission, notes, dueDate
    } = body;

    if (!client || !summaryNumber || !taxPeriod) {
        throw new Error(`Missing required fields for Summary Creation.`);
    }

    const newSummary = await SummaryModel.create({
        client,
        summaryNumber,
        date: date ? new Date(date) : undefined,
        taxPeriod,
        status: status || "Draft",
        summaryTaxes: summaryTaxes || [],
        totalBaseAmount: totalBaseAmount || 0,
        totalTaxAmount: totalTaxAmount || 0,
        summarySubTotal: summarySubTotal || 0,
        netPayable: netPayable || 0,
        discount: discount || 0,
        commission: commission || 0,
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined
    });

    if (billsToLock && billsToLock.length > 0) {
        await BillModel.updateMany(
            { _id: { $in: billsToLock } },
            { 
                $set: { 
                    summary: newSummary._id,
                    status: "Summarized" 
                } 
            }
        );
        
        await SummaryModel.findByIdAndUpdate(newSummary._id, {
            $push: { bills: { $each: billsToLock } }
        });
    }

    return newSummary;
}

// ── Read (All) with Search, Filter, Pagination ──────────
export async function getSummariesService(params: SummaryQueryParams = {}) {
    const { search, status, startDate, endDate, page = 1, limit = 10 } = params;

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * safeLimit;

    const filter: MongoFilter = {};

    if (search) {
        const searchRegex = new RegExp(search, "i");
        const matchingClients = await ClientModel.find({ name: searchRegex }, { _id: 1 });
        const clientIds = matchingClients.map((c) => c._id);

        filter.$or = [
            { client: { $in: clientIds } },
            { summaryNumber: searchRegex },
        ];
    }

    if (status) {
        filter.status = status;
    }

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
        SummaryModel.find(filter)
            .populate("client", "name")
            .populate("bills")
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
export async function getSingleSummaryService(id: string) {
    const summary = await SummaryModel.findById(id)
        .populate("client", "name")
        .populate("bills"); 

    if (!summary) throw new Error("Summary not found.");
    
    return summary; 
}

// ── Update ──────────────────────────────────────────────
export async function updateSummaryService(id: string, data: Partial<Summary>) {
    // We use a generic Record here to avoid TS clashing with Date vs String types during update
    const updateData: Record<string, unknown> = { ...data };

    if (data.date) {
        updateData.date = new Date(data.date);
    }

    return await SummaryModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );
}

// ── Delete ──────────────────────────────────────────────
export async function deleteSummaryService(id: string) {
    await BillModel.updateMany(
        { summary: id },
        { 
            $unset: { summary: 1 },
            $set: { status: "Unbilled" }
        }
    );
    
    return await SummaryModel.findByIdAndDelete(id);
}