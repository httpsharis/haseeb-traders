import mongoose from "mongoose";
import billModel from "@/models/billModel";
import { Bill, LineItem } from "@/types";
import { Decimal } from "decimal.js";
import SummaryModel from "@/models/summaryModel";
import "@/models/clientModel";
// ── THE MATH ENGINE ─────────────────────────────────────
// Automatically calculates all base amounts and taxes for line items
// ── THE MATH ENGINE ─────────────────────────────────────
function calculateBillTotals(items: LineItem[] = []) {
  // Start totals as Decimal objects, not standard numbers
  let masterBaseAmount = new Decimal(0);
  let masterTaxAmount = new Decimal(0);

  const processedItems = items.map(item => {
    // 1. Calculate Item Base (Qty * Price) safely
    const qty = new Decimal(item.quantity || 0);
    const price = new Decimal(item.unitPrice || 0);
    const itemBase = qty.mul(price);

    masterBaseAmount = masterBaseAmount.add(itemBase);

    // 2. Process Item Taxes safely
    let itemTaxTotal = new Decimal(0);
    const processedTaxes = (item.taxes || []).map(tax => {
      const percentage = new Decimal(tax.percentage || 0);
      const taxAmt = itemBase.mul(percentage.div(100));

      itemTaxTotal = itemTaxTotal.add(taxAmt);

      return {
        ...tax,
        baseAmount: itemBase.toNumber(),
        amount: taxAmt.toNumber()
      };
    });

    masterTaxAmount = masterTaxAmount.add(itemTaxTotal);

    // 3. Convert back to standard numbers for the database
    return {
      ...item,
      amount: itemBase.toNumber(),
      taxes: processedTaxes
    };
  });

  // 4. Return the final, perfect master totals
  return {
    processedItems,
    baseAmount: masterBaseAmount.toNumber(),
    taxAmount: masterTaxAmount.toNumber(),
    amount: masterBaseAmount.add(masterTaxAmount).toNumber()
  };
}

// ── Create a new bill ───────────────────────────────────
export async function createBillService(data: Partial<Bill>) {
  // Run the math engine before saving to the database
  const totals = calculateBillTotals(data.items || []);

  const payload = {
    ...data,
    items: totals.processedItems,
    baseAmount: totals.baseAmount,
    taxAmount: totals.taxAmount,
    amount: totals.amount
  };

  return await billModel.create(payload);
}

// ── Get all bills for a specific summary ────────────────
export async function getBillsBySummaryService(summaryId: string) {
  return await billModel.find({ summary: summaryId }).sort({ createdAt: -1 }).lean();
}

// ── Get a single bill by its ID ─────────────────────────
export async function getSingleBillService(id: string) {
  return await billModel.findById(id).populate("client", "name companyName").lean();
}

// ── Update an existing bill ─────────────────────────────
// ── Update an existing bill ─────────────────────────────
export async function updateBillService(id: string, data: Partial<Bill>) {
  // Use const! We mutate the properties, but not the variable itself.
  const updatePayload = { ...data };

  // If the update includes line items, we MUST recalculate the totals
  if (data.items) {
    const totals = calculateBillTotals(data.items);
    updatePayload.items = totals.processedItems;
    updatePayload.baseAmount = totals.baseAmount;
    updatePayload.taxAmount = totals.taxAmount;
    updatePayload.amount = totals.amount;
  }

  return await billModel.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  });
}

// ── Delete a single bill ────────────────────────────────
export async function deleteBillService(id: string) {
  return await billModel.findByIdAndDelete(id);
}

// ── Delete all bills for a summary (cascade) ────────────
export async function deleteBillsBySummaryService(summaryId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await billModel.deleteMany({ summary: summaryId }).session(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// ── Dashboard: Get Stats ────────────────────────────────
export async function getDashboardStatsService() {
  const [totalSummaries, billStats] = await Promise.all([
    SummaryModel.countDocuments(),
    billModel.aggregate([
      {
        $facet: {
          totalCounts: [
            { $count: "count" }
          ],
          pendingTotals: [
            { $match: { status: { $ne: "Summarized" } } },
            { $group: { _id: null, amount: { $sum: "$amount" } } }
          ]
        }
      }
    ])
  ]);

  const totalBills = billStats[0]?.totalCounts[0]?.count || 0;
  const pendingAmount = billStats[0]?.pendingTotals[0]?.amount || 0;

  return { totalSummaries, totalBills, pendingAmount };
}

// ── Dashboard: Get Recent Activity ──────────────────────
export async function getRecentActivityService(limit: number = 20) {
  const [recentSummaries, recentBills] = await Promise.all([
    SummaryModel.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientDetails"
        }
      },
      { $unwind: { path: "$clientDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "bills",
          localField: "_id",
          foreignField: "summary",
          as: "bills"
        }
      },
      {
        $addFields: {
          clientName: "$clientDetails.name",
          totalAmount: {
            $sum: {
              $map: {
                input: "$bills",
                as: "b",
                in: { $multiply: ["$$b.quantity", "$$b.unitPrice"] }
              }
            }
          }
        }
      },
      {
        $project: {
          bills: 0,
          clientDetails: 0
        }
      }
    ]),
    billModel.find().sort({ createdAt: -1 }).limit(limit).populate("client", "name companyName").lean(),
  ]);

  return {
    summaries: recentSummaries,
    bills: recentBills
  };
}