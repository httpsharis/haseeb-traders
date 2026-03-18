import { IInvoiceItem } from "@/types";

export function calculateBillTotals(items: IInvoiceItem[]) {
  let baseAmount = 0;
  let totalGST = 0;

  items.forEach((item) => {
    const rowSubtotal = item.qty * item.unitPrice;
    const rowGST = rowSubtotal * (item.gstPercentage / 100);

    baseAmount += rowSubtotal;
    totalGST += rowGST;
  });

  const grandTotal = baseAmount + totalGST;

  return {
    baseAmount,
    totalGST,
    grandTotal,
  };
}