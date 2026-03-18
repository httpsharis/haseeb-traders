import { IBill } from "@/types";

// ── Calculate Bill Totals ───────────────────────────────
// Computes the base amount and total taxes for a list of bills.
export function calculateBillTotals(bills: IBill[]) {
  let baseAmount = 0;
  let totalTax = 0;

  bills.forEach((bill) => {
    // Row subtotal = quantity * unit price
    const rowSubtotal = bill.quantity * bill.unitPrice;
    baseAmount += rowSubtotal;

    // Sum all tax amounts applied to this bill
    if (bill.taxes && bill.taxes.length > 0) {
      bill.taxes.forEach((tax) => {
        totalTax += tax.amount;
      });
    }
  });

  const grandTotal = baseAmount + totalTax;

  return {
    baseAmount,
    totalTax,
    grandTotal,
  };
}