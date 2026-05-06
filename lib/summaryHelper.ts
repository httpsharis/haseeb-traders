export type ClientType = { _id: string; name?: string; companyName?: string };

export type BillItem = {
  amount?: string | number;
  total?: string | number;
  quantity?: string | number;
  price?: string | number;
  unitPrice?: string | number;
  rate?: string | number;
};

export type BillType = { 
  _id: string; 
  description?: string; 
  category?: string;
  billNumber?: string;
  invoiceNumber?: string;
  date?: string; 
  amount?: number | string; 
  baseAmount?: number | string;
  subTotal?: number | string;
  totalAmount?: number | string;
  netAmount?: number | string;
  total?: number | string;
  quantity?: number | string;
  unitPrice?: number | string;
  price?: number | string;
  client?: ClientType | string | null; 
  items?: BillItem[];
};

export function getClientId(client: BillType["client"]): string {
  if (!client) return "";
  if (typeof client === "string") return client;
  return client._id || "";
}

export function getClientName(client: BillType["client"]): string {
  if (!client || typeof client === "string") return "";
  return (client.name || client.companyName || "").trim();
}

export function parseAmt(val: string | number | undefined | null): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const num = Number(val.toString().replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

export function getBaseAmount(bill: BillType): number {
  const directTotals = [bill.baseAmount, bill.amount, bill.subTotal, bill.totalAmount, bill.netAmount, bill.total];
  for (const t of directTotals) {
    if (t !== undefined && t !== null && t !== "") {
      const val = parseAmt(t);
      if (!isNaN(val)) return val;
    }
  }

  if (Array.isArray(bill.items) && bill.items.length > 0) {
    let sum = 0;
    bill.items.forEach((item) => {
      let itemTotal = 0;
      if (item.amount !== undefined && item.amount !== null && item.amount !== "") {
        itemTotal = parseAmt(item.amount);
      } else if (item.total !== undefined && item.total !== null && item.total !== "") {
        itemTotal = parseAmt(item.total);
      } else {
        const qty = (item.quantity !== undefined && item.quantity !== null && item.quantity !== "") ? parseAmt(item.quantity) : 1;
        const prc = parseAmt(item.price ?? item.unitPrice ?? item.rate);
        itemTotal = qty * prc;
      }
      sum += itemTotal;
    });
    return sum;
  }

  const qty = (bill.quantity !== undefined && bill.quantity !== null && bill.quantity !== "") ? parseAmt(bill.quantity) : 1;
  const prc = parseAmt(bill.unitPrice ?? bill.price);
  return qty * prc;
}

// Add these to the BOTTOM of lib/summary-helpers.ts

export type TaxApplicationTarget = "BaseAmount" | "SubtotalAmount";
export type TaxFinancialImpact = "Add" | "DisplayOnly";

export interface DBTaxRule {
    name: string;
    percentage: number;
    target?: TaxApplicationTarget;
    impact?: TaxFinancialImpact;
}

export interface GlobalAppliedTax {
    id: string;
    name: string;
    percentage: number;
    target: TaxApplicationTarget;
    impact: TaxFinancialImpact;
    calculatedAmount?: number;
}

export interface RawTaxRule {
    taxName?: string;
    name?: string;
    title?: string;
    rate?: number | string;
    percentage?: number | string;
    value?: number | string;
    target?: string;
    impact?: string;
    status?: string | boolean;
    isActive?: boolean;
}

export function generateId() { 
    return Math.random().toString(36).substring(2, 9); 
}