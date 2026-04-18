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
    const val = parseAmt(t);
    if (val > 0) return val;
  }

  if (Array.isArray(bill.items) && bill.items.length > 0) {
    let sum = 0;
    bill.items.forEach((item) => {
      const itemTotal = parseAmt(item.amount) || parseAmt(item.total) || ( (parseAmt(item.quantity) || 1) * parseAmt(item.price || item.unitPrice || item.rate) );
      sum += itemTotal;
    });
    if (sum > 0) return sum;
  }

  const flat = (parseAmt(bill.quantity) || 1) * parseAmt(bill.unitPrice || bill.price);
  return flat > 0 ? flat : 0;
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