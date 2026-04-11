/**
 * Bill Wizard Types
 * Simple types for the multi-step bill creation flow.
 */

export interface TaxCharge {
  name: string;
  percentage: number;
  baseAmount: number;
  amount: number;
}

export interface LineItem {
  id: string; // Temporary client-side ID
  _id?: string; // Add this! (Optional MongoDB ID for editing)
  billNumber: string;
  date: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  amount?: number; // Add this! (Optional calculated amount)
  taxes: TaxCharge[];
}

export interface WizardData {
  // Step 1: Client
  _id?: string;
  clientId: string;
  clientName: string;
  summaryNumber: string;
  taxPeriod: string;
  date: string;
  // Step 2 & 3: Line items with taxes
  items: LineItem[];
  // Summary-level taxes (persisted from taxes step)
  summaryTaxes: TaxCharge[];
  // Summary level
  discount: number;
  commission: number;
}

export interface TaxType {
  _id: string;
  name: string;
  percentage: number;
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface Client {
  _id: string;
  name: string;
}

// Calculate totals for a line item
export function calculateItemTotal(item: LineItem): number {
  return item.quantity * item.unitPrice;
}

// Calculate tax for a line item
export function calculateItemTaxTotal(item: LineItem): number {
  return item.taxes.reduce((sum, t) => sum + t.amount, 0);
}

// Calculate grand total for all items
export function calculateGrandTotal(items: LineItem[], discount = 0): number {
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const taxes = items.reduce((sum, item) => sum + calculateItemTaxTotal(item), 0);
  return subtotal + taxes - discount;
}
