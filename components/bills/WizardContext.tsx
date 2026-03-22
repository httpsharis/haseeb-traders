"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { WizardData, LineItem } from "./types";

interface WizardContextType {
  data: WizardData;
  setClientInfo: (clientId: string, clientName: string, summaryNumber: string, taxPeriod: string, date: string) => void;
  addItem: (item: LineItem) => void;
  updateItem: (id: string, updates: Partial<LineItem>) => void;
  removeItem: (id: string) => void;
  setDiscount: (val: number) => void;
  setCommission: (val: number) => void;
  reset: () => void;
}

const defaultData: WizardData = {
  clientId: "",
  clientName: "",
  summaryNumber: "",
  taxPeriod: "",
  date: new Date().toISOString().split("T")[0],
  items: [],
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

  const reset = () => setData(defaultData);

  return (
    <WizardContext.Provider
      value={{ data, setClientInfo, addItem, updateItem, removeItem, setDiscount, setCommission, reset }}
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
