import { Client } from "./client";

export type BillStatus = "Unbilled" | "Summarized";

export interface TaxCharge {
    _id?: string;
    name: string;
    percentage: number;
    baseAmount: number;
    amount: number;
}

export interface LineItem {
    _id?: string;
    description: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxes?: TaxCharge[];
}

export interface Bill {
    _id: string;
    client: string | Client;
    summary?: string;
    status?: BillStatus;
    billNumber?: string;
    date?: string;
    
    // Master Totals
    description?: string;
    category?: string;
    baseAmount: number;
    taxAmount: number;
    amount: number; // This is the totalAmount
    
    items: LineItem[];
    
    createdAt?: string;
    updatedAt?: string;
}