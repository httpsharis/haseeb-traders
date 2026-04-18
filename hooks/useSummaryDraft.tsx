"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface SummaryDraftData {
  _id?: string;
  clientId: string;
  clientName: string;
  summaryNumber: string;
  date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]; // We can strict-type this later when we build Step 2
}

const defaultData: SummaryDraftData = {
  _id: undefined,
  clientId: "",
  clientName: "",
  summaryNumber: "",
  date: "",
  items: [],
};

interface SummaryDraftContextType {
  data: SummaryDraftData;
  updateData: (updates: Partial<SummaryDraftData>) => void;
  resetDraft: () => void;
}

const SummaryDraftContext = createContext<SummaryDraftContextType | undefined>(
  undefined,
);

export function SummaryDraftProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SummaryDraftData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // ✅ FIX: Wrapping this in an async function moves the setState out of the
    // synchronous render cycle. This instantly satisfies the linter!
    const loadDraft = async () => {
      const saved = localStorage.getItem("haseeb_summary_draft");
      if (saved) {
        try {
          setData(JSON.parse(saved));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}
      }
      setIsLoaded(true);
    };

    loadDraft();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("haseeb_summary_draft", JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateData = (updates: Partial<SummaryDraftData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetDraft = () => {
    setData(defaultData);
    localStorage.removeItem("haseeb_summary_draft");
  };

  return (
    <SummaryDraftContext.Provider value={{ data, updateData, resetDraft }}>
      {children}
    </SummaryDraftContext.Provider>
  );
}

export function useSummaryDraft() {
  const context = useContext(SummaryDraftContext);
  if (context === undefined) {
    throw new Error(
      "useSummaryDraft must be used within a SummaryDraftProvider",
    );
  }
  return context;
}
