"use client";

import { createElement, createContext, useContext, useState, useEffect, ReactNode } from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TaxCharge {
  name: string;
  percentage: number;
  baseAmount: number;
  amount: number;
}

export interface LineItem {
  id: string;
  billNumber?: string;
  date?: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  taxes: TaxCharge[];
}

export interface BillDraftData {
  clientId: string;
  clientName: string;
  summaryNumber: string;
  taxPeriod: string;
  date: string;
  items: LineItem[];
  summaryTaxes: TaxCharge[];
  discount: number;
  commission: number;
}

interface BillDraftContextType {
  data: BillDraftData;
  updateData: (updates: Partial<BillDraftData>) => void;
  addItem: (item: LineItem) => void;
  updateItem: (id: string, updates: Partial<LineItem>) => void;
  removeItem: (id: string) => void;
  applyTaxesToItems: (taxes: TaxCharge[]) => void;
  resetDraft: () => void;
}

const defaultData: BillDraftData = {
  clientId: "",
  clientName: "",
  summaryNumber: "",
  taxPeriod: "",
  date: new Date().toISOString().split("T")[0],
  items: [],
  summaryTaxes: [],
  discount: 0,
  commission: 0,
};

// ============================================================================
// CONTEXT ENGINE
// ============================================================================
const BillDraftContext = createContext<BillDraftContextType | null>(null);

// Inside hooks/useBillDraft.tsx

export function BillDraftProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BillDraftData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false); // Prevents hydration errors in Next.js

  // CACHE LOAD: Run once when the app starts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const savedDraft = localStorage.getItem("haseeb_bill_draft");
      if (savedDraft) {
        try {
          setData(JSON.parse(savedDraft));
        } catch (err) {
          console.error("Failed to load draft from cache", err);
        }
      }
      setIsLoaded(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  // CACHE SAVE: Run every time 'data' changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("haseeb_bill_draft", JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // 1. Master Update Function
  const updateData = (updates: Partial<BillDraftData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  // 2. Line Item Management
  const addItem = (item: LineItem) => {
    setData((prev) => ({ ...prev, items: [...prev.items, item] }));
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, ...updates };

        // Automatically recalculate taxes if quantity or unitPrice changed
        if (updatedItem.taxes && updatedItem.taxes.length > 0) {
          const newBase = updatedItem.quantity * updatedItem.unitPrice;
          updatedItem.taxes = updatedItem.taxes.map(t => ({
            ...t,
            baseAmount: newBase,
            amount: (newBase * t.percentage) / 100
          }));
        }

        return updatedItem;
      }),
    }));
  };

  const removeItem = (id: string) => {
    setData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  // 3. Tax Mathematics
  const applyTaxesToItems = (taxes: TaxCharge[]) => {
    setData((prev) => {
      const subtotal = prev.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      if (subtotal === 0) return prev;

      const updatedItems = prev.items.map((item) => {
        const itemAmount = item.quantity * item.unitPrice;
        const proportion = itemAmount / subtotal;

        const itemTaxes: TaxCharge[] = taxes.map((tax) => ({
          name: tax.name,
          percentage: tax.percentage,
          baseAmount: tax.baseAmount * proportion,
          amount: tax.amount * proportion,
        }));

        return { ...item, taxes: itemTaxes };
      });

      return { ...prev, items: updatedItems, summaryTaxes: taxes };
    });
  };

  // 4. Reset & Clear Cache (Call this after successful database save!)
  const resetDraft = () => {
    setData(defaultData);
    localStorage.removeItem("haseeb_bill_draft");
  };

  // Don't render children until cache is checked to avoid UI flashing
  if (!isLoaded) return null;

  return createElement(
    BillDraftContext.Provider,
    {
      value: {
        data, updateData, addItem, updateItem, removeItem, applyTaxesToItems, resetDraft
      }
    },
    children
  );
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================
export function useBillDraft() {
  const ctx = useContext(BillDraftContext);
  if (!ctx) {
    // This error triggers if you forgot to wrap your page in <BillDraftProvider />
    throw new Error("useBillDraft must be used within a BillDraftProvider");
  }
  return ctx;
}