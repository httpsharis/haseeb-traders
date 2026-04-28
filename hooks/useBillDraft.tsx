"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";

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
  _id?: string;
  clientId: string;
  clientName: string;
  summaryNumber: string;
  taxPeriod: string;
  date: string;
  items: LineItem[];
  summaryTaxes: TaxCharge[];
  discount: number;
  commission: number;
  status?: string;
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
  _id: undefined,
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
const BillDraftContext = createContext<BillDraftContextType | undefined>(undefined);

export function BillDraftProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const draftId = searchParams?.get("draftId");
  
  const [data, setData] = useState<BillDraftData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. DATABASE LOAD: Hydrate from API
  useEffect(() => {
    const loadDraft = async () => {
      // Prioritize loading the draft from the DB if draftId is present
      if (draftId) {
        try {
          const res = await fetch(`/api/bills/${draftId}`);
          if (res.ok) {
            const dbDraft = await res.json();
            // Handle populated client vs raw clientId
            const clientId = dbDraft.client?._id || dbDraft.client || "";
            const clientName = dbDraft.client?.name || "";
            
            setData({
              ...defaultData,
              ...dbDraft,
              clientId,
              clientName,
            });
            setIsLoaded(true);
            return;
          }
        } catch (err) {
          console.error("Failed to load draft from database", err);
        }
      }
      
      // Fallback checkout local storage if no draftId
      if (!draftId) {
          const savedDraft = localStorage.getItem("haseeb_bill_draft");
          if (savedDraft) {
            try {
              setData(JSON.parse(savedDraft));
            } catch (err) {
              console.error("Failed to load draft from cache", err);
            }
          }
      }
      setIsLoaded(true);
    };

    loadDraft();
  }, [draftId]);

  // 2. DATABASE AUTO-SAVE ENGINE 
  useEffect(() => {
    // Only auto-save if we are loaded, and we have an actionable state
    if (!isLoaded || (data.status !== "Draft" && !data._id && !draftId)) {
        // We preserve local storage for pure clientside sessions just in case
        if (isLoaded) localStorage.setItem("haseeb_bill_draft", JSON.stringify(data));
        return;
    }

    const saveDraftTimer = setTimeout(async () => {
      try {
        const payload: any = { ...data };
        
        // Mongo map fields appropriately
        if (payload.clientId) {
            payload.client = payload.clientId;
        } else {
             delete payload.client; // Strip client if empty to prevent MongoDB cast errors
        }

        await fetch(`/api/bills`, {
          method: "POST", // The route handles upsert automatically
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 1200); // 1.2 second debounce
    
    return () => clearTimeout(saveDraftTimer);
  }, [data, isLoaded, draftId]);

  // 3. Master Update Function
  const updateData = (updates: Partial<BillDraftData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  // 4. Line Item Management
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

  // 5. Tax Mathematics
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

  // 6. Reset & Clear Cache
  const resetDraft = () => {
    setData({ ...defaultData, _id: draftId || undefined });
    localStorage.removeItem("haseeb_bill_draft");
  };

  // Don't render children until cache is checked to avoid UI flashing
  if (!isLoaded) return null;

  return (
    <BillDraftContext.Provider
      value={{ data, updateData, addItem, updateItem, removeItem, applyTaxesToItems, resetDraft }}
    >
      {children}
    </BillDraftContext.Provider>
  );
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================
export function useBillDraft() {
  const context = useContext(BillDraftContext);
  if (context === undefined) {
    throw new Error("useBillDraft must be used within a BillDraftProvider");
  }
  return context;
}