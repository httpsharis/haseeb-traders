export type TaxApplicationTarget = "BaseAmount" | "SubtotalAmount";
export type TaxFinancialImpact = "Add" | "DisplayOnly";

// Represents a global rule saved in your settings
export interface TaxRule {
    _id?: string;
    name: string;
    taxName?: string;
    percentage: number;
    rate?: number | string;
    target: TaxApplicationTarget;
    impact: TaxFinancialImpact;
    status?: string | boolean;
}

// Represents a tax ACTUALLY applied to a specific summary
export interface AppliedTax {
    id: string;           // React UI ID
    _id?: string;         // MongoDB ID
    name: string;
    percentage: number;
    target: TaxApplicationTarget;
    impact: TaxFinancialImpact;
    amount?: number;      // The actual Rupees saved in the DB
    calculatedAmount?: number; // Temporary math value for the UI
}