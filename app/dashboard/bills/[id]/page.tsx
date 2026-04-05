"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useWizard } from "@/components/bills";
import { LineItem } from "@/components/bills/types";

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
        // We are fetching a single Bill, NOT a summary
        const res = await fetch(`/api/bills/${billId}`);
        if (!res.ok) throw new Error("Failed to load bill");

        const bill = await res.json();

        // Seed the Wizard Context with this single bill as the only item
        // This tricks the wizard into letting us edit this bill using the existing UI
        setData({
          clientId: bill.client?._id || bill.client || "existing-client",
          clientName: bill.client?.companyName || bill.client?.name || "Unknown Client",
          taxPeriod: "", // Not natively stored on individual bills, but user can fill it in Step 1
          summaryNumber: bill.billNumber || "", // Map the Bill's Number to the Wizard's summary number field
          date: bill.date ? new Date(bill.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          items: [
             {
               ...bill,
               id: bill._id || bill.id || `item_${Date.now()}`
             }
          ] as LineItem[],
          summaryTaxes: [],
          discount: 0,
          commission: 0,
        });

        // Redirect to Step 1 of the wizard where they can review/edit the Bill #, Date, and Period
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
        <h2 className="text-xl font-bold text-slate-700">Loading Bill into Wizard...</h2>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return null;
}
