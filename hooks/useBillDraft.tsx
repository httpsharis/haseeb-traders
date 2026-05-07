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
  _id?: string;
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
  baseAmount?: number;
  taxAmount?: number;
  amount?: number;
}

export interface BillServerResponse {
  _id: string;
  baseAmount: number;
  taxAmount: number;
  amount: number;
  items: Array<{
    id: string;
    _id: string;
    amount: number;
    taxes: TaxCharge[];
  }>;
}

interface BillDraftContextType {
  data: BillDraftData;
  error: string | null;
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
  baseAmount: 0,
  taxAmount: 0,
  amount: 0,
};

function calculateTotals(items: LineItem[]) {
  let baseAmount = 0;
  let taxAmount = 0;

  items.forEach(item => {
    const qty = item.quantity !== undefined && item.quantity !== null ? item.quantity : 1;
    const price = item.unitPrice || 0;
    const itemBase = qty * price;
    baseAmount += itemBase;

    let itemTaxTotal = 0;
    if (item.taxes && item.taxes.length > 0) {
      item.taxes.forEach(tax => {
        const percentage = tax.percentage || 0;
        itemTaxTotal += (itemBase * percentage) / 100;
      });
    }
    taxAmount += itemTaxTotal;
  });

  return {
    baseAmount,
    taxAmount,
    amount: baseAmount + taxAmount
  };
}

// ============================================================================
// CONTEXT ENGINE
// ============================================================================
const BillDraftContext = createContext<BillDraftContextType | undefined>(undefined);

export function BillDraftProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const draftId = searchParams?.get("draftId");
  
  const [data, setData] = useState<BillDraftData>(defaultData);
  const [error, setError] = useState<string | null>(null);
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
        const payload: Partial<BillDraftData> & { client?: string } = { ...data };
        
        // Mongo map fields appropriately
        if (payload.clientId) {
            payload.client = payload.clientId;
        } else {
             delete payload.client; // Strip client if empty to prevent MongoDB cast errors
        }

        const res = await fetch(`/api/bills`, {
          method: "POST", // The route handles upsert automatically
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        if (res.ok) {
            setError(null);
            const updatedDbRecord = await res.json();
            
            // Sync ID and totals from DB response
            setData((prev) => {
                const next = { ...prev };
                if (!prev._id && updatedDbRecord._id) {
                    next._id = updatedDbRecord._id;
                }
                
                // Sync calculations from backend to ensure accuracy
                if (updatedDbRecord.baseAmount !== undefined) next.baseAmount = updatedDbRecord.baseAmount;
                if (updatedDbRecord.taxAmount !== undefined) next.taxAmount = updatedDbRecord.taxAmount;
                if (updatedDbRecord.amount !== undefined) next.amount = updatedDbRecord.amount;
                
                return next;
            });
            
            // Update the URL so the user doesn't lose the draft on refresh
            if (!data._id && updatedDbRecord._id && !draftId) {
                window.history.replaceState(null, '', `?draftId=${updatedDbRecord._id}`);
            }
        } else {
            const errorData = await res.json();
            setError(errorData.error || "Failed to auto-save");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error during auto-save");
        console.error("Auto-save failed", err);
      }
    }, 1200); // 1.2 second debounce
    
    return () => clearTimeout(saveDraftTimer);
  }, [data, isLoaded, draftId]);

  // 3. Master Update Function
  const updateData = (updates: Partial<BillDraftData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };
      if (updates.items) {
        Object.assign(next, calculateTotals(next.items));
      }
      return next;
    });
  };

  // 4. Line Item Management
  const addItem = (item: LineItem) => {
    setData((prev) => {
      const newItems = [...prev.items, item];
      return { ...prev, items: newItems, ...calculateTotals(newItems) };
    });
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    setData((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id !== id) return item;
        return { ...item, ...updates };
      });
      return { ...prev, items: newItems, ...calculateTotals(newItems) };
    });
  };

  const removeItem = (id: string) => {
    setData((prev) => {
      const newItems = prev.items.filter((item) => item.id !== id);
      return { ...prev, items: newItems, ...calculateTotals(newItems) };
    });
  };

  // 5. Tax Mathematics
  const applyTaxesToItems = (taxes: TaxCharge[]) => {
    setData((prev) => {
      const updatedItems = prev.items.map((item) => {
        const itemTaxes: TaxCharge[] = taxes.map((tax) => ({
          name: tax.name,
          percentage: tax.percentage,
          baseAmount: 0, // Backend will calculate this
          amount: 0,     // Backend will calculate this
        }));

        return { ...item, taxes: itemTaxes };
      });

      return { ...prev, items: updatedItems, summaryTaxes: taxes, ...calculateTotals(updatedItems) };
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
      value={{ data, error, updateData, addItem, updateItem, removeItem, applyTaxesToItems, resetDraft }}
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