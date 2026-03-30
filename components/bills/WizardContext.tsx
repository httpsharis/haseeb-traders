"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from "react";
import { WizardData, LineItem, TaxCharge } from "./types";

interface WizardContextType {
  data: WizardData;
  setClientInfo: (clientId: string, clientName: string, summaryNumber: string, taxPeriod: string, date: string) => void;
  addItem: (item: LineItem) => void;
  updateItem: (id: string, updates: Partial<LineItem>) => void;
  removeItem: (id: string) => void;
  setDiscount: (val: number) => void;
  setCommission: (val: number) => void;
  setSummaryTaxes: (taxes: TaxCharge[]) => void;
  applyTaxesToItems: (taxes: TaxCharge[]) => void;
  reset: () => void;
  setData: Dispatch<SetStateAction<WizardData>>;
}

const defaultData: WizardData = {
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

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WizardData>(defaultData);

  const setClientInfo = (clientId: string, clientName: string, summaryNumber: string, taxPeriod: string, date: string) => {
    setData((prev) => ({ ...prev, clientId, clientName, summaryNumber, taxPeriod, date }));
  };

  const addItem = (item: LineItem) => {
    setData((prev) => ({ ...prev, items: [...prev.items, item] }));
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  };

  const removeItem = (id: string) => {
    setData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  const setDiscount = (val: number) => setData((prev) => ({ ...prev, discount: val }));
  const setCommission = (val: number) => setData((prev) => ({ ...prev, commission: val }));

  // Save summary-level tax selections
  const setSummaryTaxes = (taxes: TaxCharge[]) => {
    setData((prev) => ({ ...prev, summaryTaxes: taxes }));
  };

  // Distribute summary-level taxes proportionally to each line item
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

  const reset = () => setData(defaultData);

  return (
    <WizardContext.Provider
      value={{ data, setClientInfo, addItem, updateItem, removeItem, setDiscount, setCommission, setSummaryTaxes, applyTaxesToItems, reset, setData }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
