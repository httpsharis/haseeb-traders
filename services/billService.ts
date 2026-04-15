import billModel from "@/models/billModel";
import { Bill, LineItem } from "@/types"; 

// ── THE MATH ENGINE ─────────────────────────────────────
// Automatically calculates all base amounts and taxes for line items
function calculateBillTotals(items: LineItem[] = []) {
    let masterBaseAmount = 0;
    let masterTaxAmount = 0;

    const processedItems = items.map(item => {
        // 1. Calculate Item Base (Qty * Price)
        const itemBase = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        masterBaseAmount += itemBase;

        // 2. Process Item Taxes
        let itemTaxTotal = 0;
        const processedTaxes = (item.taxes || []).map(tax => {
            const taxAmt = itemBase * ((Number(tax.percentage) || 0) / 100);
            itemTaxTotal += taxAmt;
            return {
                ...tax,
                baseAmount: itemBase,
                amount: taxAmt
            };
        });

        masterTaxAmount += itemTaxTotal;

        // 3. Return the fully calculated line item
        return {
            ...item,
            amount: itemBase,
            taxes: processedTaxes
        };
    });

    // 4. Return the master totals for the Bill
    return {
        processedItems,
        baseAmount: masterBaseAmount,
        taxAmount: masterTaxAmount,
        amount: masterBaseAmount + masterTaxAmount // Net Total
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
  return await billModel.find({ summary: summaryId }).sort({ createdAt: -1 });
}

// ── Get a single bill by its ID ─────────────────────────
export async function getSingleBillService(id: string) {
  return await billModel.findById(id).populate("client", "name companyName");
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
  return await billModel.deleteMany({ summary: summaryId });
}