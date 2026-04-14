import { Client } from "./client";
import { Bill } from "./bill";
import { AppliedTax } from "./tax";

export interface Summary {
    _id: string;
    summaryNumber: string;
    date: string;
    taxPeriod?: string;
    
    client: string | Client; // Just ID, or full object
    bills: string[] | Bill[]; // Array of IDs, or full objects
    
    // Financials
    summarySubTotal: number;
    totalTaxAmount: number;
    netPayable: number;
    summaryTaxes: AppliedTax[];
    
    status?: string;
}

// Helper for our math engine
export interface MathResults {
    combinedBillsTotal: number;
    processedTaxes: AppliedTax[];
    standardTaxesTotal: number;
    totalIncomeTaxToPay: number;
    finalNetTotal: number;
}