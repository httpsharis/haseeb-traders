"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useWizard } from "@/components/bills";
import { LineItem } from "@/components/bills/types";

// FIX: Added strict typing for the incoming database item to eliminate 'any'
interface RawLineItem {
  _id?: string;
  description?: string;
  category?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  taxes?: { name: string; percentage: number; baseAmount: number; amount: number }[];
}

export default function EditBillPage() {
  const router = useRouter();
  const params = useParams();
  const { setData } = useWizard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const billId = params.id as string;
    if (!billId) return;

    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/bills/${billId}`);
        if (!res.ok) throw new Error("Failed to load bill");

        const bill = await res.json();

        // Check if this is a NEW master bill with an items array, 
        // OR an OLD legacy bill that only has top-level item data.
        const hasItemsArray = Array.isArray(bill.items) && bill.items.length > 0;

        // FIX: Replaced 'any' with the strict 'RawLineItem' interface
        const formattedItems = hasItemsArray 
            ? bill.items.map((item: RawLineItem) => ({
                ...item,
                id: item._id || `item_${Math.random().toString(36).substring(7)}` 
              }))
            : [{
                ...bill,
                id: bill._id || `item_${Date.now()}`
              }]; 

        // Seed the Wizard Context
        setData({
          clientId: bill.client?._id || bill.client || "existing-client",
          clientName: bill.client?.companyName || bill.client?.name || "Unknown Client",
          taxPeriod: bill.taxPeriod || "", 
          summaryNumber: bill.billNumber || "", 
          date: bill.date ? new Date(bill.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          items: formattedItems as LineItem[],
          summaryTaxes: [],
          discount: 0,
          commission: 0,
        });

        // Redirect to Step 1 of the wizard
        router.push("/dashboard/bills/new");
      } catch (err) {
        console.error("API Error:", err);
        setError(
          "Could not find this bill. It may have been deleted or the API route is missing.",
        );
        setLoading(false);
      }
    };

    fetchBill();
  }, [params.id, setData, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-[#ea580c] animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Loading Invoice into Wizard...</h2>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center font-bold text-red-500 bg-red-50 rounded-lg max-w-md mx-auto mt-20 border border-red-200">{error}</div>;
  }

  return null;
}