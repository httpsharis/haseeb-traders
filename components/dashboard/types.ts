/**
 * Dashboard Types
 * ================
 * Centralized type definitions for all dashboard components.
 * These types mirror the MongoDB schemas for type-safe frontend usage.
 */

/** Client entity - represents a business client */
export interface Client {
  _id: string;
  name: string;
}

/** Summary (Invoice Master) - parent record containing multiple bills */
export interface Summary {
  _id: string;
  summaryNumber: string;
  date?: string;
  taxPeriod: string;
  status: "Draft" | "Converted";
  client: Client | null;
  createdAt: string;
}

/** Tax charge applied to a bill */
export interface TaxCharge {
  name: string;
  percentage: number;
  baseAmount: number;
  amount: number;
}

/** Bill (Invoice Line Item) - child record belonging to a summary */
export interface Bill {
  _id: string;
  billNumber?: string;
  date?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxes?: TaxCharge[];
  summary: {
    _id: string;
    client: Client | null;
  } | null;
  createdAt: string;
}

/** Dashboard statistics from /api/dashboard/stats */
export interface DashboardStats {
  totalSummaries: number;
  totalBills: number;
}

/** Pagination info from API */
export interface Pagination {
  billsPage: number;
  summariesPage: number;
  limit: number;
  totalBills: number;
  totalSummaries: number;
  totalBillPages: number;
  totalSummaryPages: number;
}

/** Complete dashboard data structure returned by useDashboardData hook */
export interface DashboardData {
  stats: DashboardStats | null;
  summaries: Summary[];
  bills: Bill[];
  billCounts: Record<string, number>;
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  // Separate pagination controls for bills and summaries
  billsPage: number;
  summariesPage: number;
  setBillsPage: (page: number) => void;
  setSummariesPage: (page: number) => void;
}
