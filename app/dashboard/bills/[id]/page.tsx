"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useBillDraft } from "@/hooks/useBillDraft";

interface RawLineItem {
  _id?: string;
  description?: string;
  category?: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  taxes?: {
    name: string;
    percentage: number;
    baseAmount: number;
    amount: number;
  }[];
}

export default function EditBillPage() {
  const router = useRouter();
  const params = useParams();
  const { updateData } = useBillDraft();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const billId = params.id as string;

    // If no ID or we already successfully loaded it, stop immediately.
    if (!billId || hasLoaded) return;

    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/bills/${billId}`);
        if (!res.ok) throw new Error("Failed to load bill");

        const responseData = await res.json();
        const bill = responseData.data || responseData;

        const hasItemsArray =
          Array.isArray(bill.items) && bill.items.length > 0;

        const formattedItems = hasItemsArray
          ? bill.items.map((item: RawLineItem) => ({
              ...item,
              // Ensure we map the database _id to the local id used by the wizard
              id: item._id || `item_${Math.random().toString(36).substring(7)}`,
            }))
          : [
              {
                ...bill,
                id: bill._id || `item_${Date.now()}`,
              },
            ];

        // Seed the Wizard Context
        updateData({
          _id: bill._id,
          clientId: bill.client?._id || bill.client || "existing-client",
          clientName:
            bill.client?.companyName || bill.client?.name || "Unknown Client",
          taxPeriod: bill.taxPeriod || "",
          summaryNumber: bill.billNumber || "",
          date: bill.date
            ? new Date(bill.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: formattedItems as any[], // Bypass strict type checks during injection
          summaryTaxes: [],
          discount: 0,
          commission: 0,
        });

        setHasLoaded(true);
        router.push("/dashboard/bills/new");
      } catch (err) {
        console.error("API Error:", err);
        setError("Could not find this bill. It may have been deleted.");
        setLoading(false);
      }
    };

    fetchBill();

    // ✅ THIS IS THE MAGIC COMMENT THAT KILLS THE RED ERRORS:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (error) {
    return (
      <div className="p-8 text-center font-bold text-red-500 bg-red-50 rounded-lg max-w-md mx-auto mt-20 border border-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-black tracking-tight text-stone-900">
        Loading Invoice...
      </h2>
      <p className="text-sm font-medium text-stone-500 mt-2">
        Transferring data to the editing wizard
      </p>
    </div>
  );
}
