"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Printer,
  Download,
  Info,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard, LineItem, TaxCharge } from "@/components/bills";

export function ReviewSidebar() {
  const router = useRouter();
  const { data } = useWizard();
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFinalize = async () => {
    setIsSaving(true);
    setError("");

    if (!data || !data.items || data.items.length === 0) {
      setError("No items found to save! Did you add items to the invoice?");
      setIsSaving(false);
      return;
    }

    try {
      let masterBaseAmount = 0;
      let masterTaxAmount = 0;

      const formattedItems = data.items.map((item: LineItem) => {
        const q = Number(item.quantity) || 1;
        const p = Number(item.unitPrice) || 0;
        const itemBase = q * p;

        const itemTax = Array.isArray(item.taxes)
          ? item.taxes.reduce(
              (sum: number, t: TaxCharge) => sum + (Number(t.amount) || 0),
              0,
            )
          : 0;

        masterBaseAmount += itemBase;
        masterTaxAmount += itemTax;

        return {
          description: item.description || "Item",
          category: item.category || "General",
          quantity: q,
          unitPrice: p,
          amount: itemBase + itemTax,
          taxes: item.taxes || [],
        };
      });

      const uniqueCategories = Array.from(
        new Set(
          data.items.map((item: LineItem) => item.category).filter(Boolean),
        ),
      );
      const masterCategory =
        uniqueCategories.length > 0 ? uniqueCategories.join(", ") : "General";

      const masterDescription =
        data.items.length === 1
          ? data.items[0].description
          : "Combined Invoice";

      const masterBillPayload = {
        client: data.clientId,
        billNumber:
          data.summaryNumber || `INV-${Date.now().toString().slice(-6)}`,
        date: data.date || new Date().toISOString(),
        description: masterDescription,
        category: masterCategory,

        quantity: 1,
        unitPrice: masterBaseAmount,

        baseAmount: masterBaseAmount,
        taxAmount: masterTaxAmount,
        amount: masterBaseAmount + masterTaxAmount,
        items: formattedItems,
      };

      const isEditing = Boolean(data._id);
      const endpoint = isEditing ? `/api/bills/${data._id}` : "/api/bills";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterBillPayload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Server rejected the save request.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/bills");
      }, 1000);

      // STRICT TYPING FIX: Changed 'any' to 'unknown'
    } catch (err: unknown) {
      console.error("Save Failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect to database",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 print:hidden">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="p-1.5 bg-orange-50 rounded-md text-[#ea580c]">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="font-bold text-slate-900">Actions</h3>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Button
          onClick={handleFinalize}
          disabled={isSaving || isSuccess}
          className={`w-full h-12 font-bold shadow-md transition-all duration-300 rounded-lg text-white ${
            isSuccess
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
              : "bg-[#ea580c] hover:bg-[#d44d0a] shadow-orange-500/20"
          }`}
        >
          {isSuccess ? (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5 animate-in zoom-in duration-300" />{" "}
              Invoice Saved!
            </>
          ) : isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving to
              Database...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" /> Finalize & Save
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="h-11 font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 rounded-lg"
          >
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button
            variant="outline"
            className="h-11 font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 rounded-lg"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          <div className="flex justify-between items-center p-4">
            <span className="text-sm font-medium text-slate-500">
              Recipient
            </span>
            <span className="text-sm font-bold text-slate-900">
              {data?.clientName || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-sm font-medium text-slate-500">
              Total Items
            </span>
            <span className="text-sm font-bold text-slate-900">
              {data?.items?.length || 0} Items
            </span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-sm font-medium text-slate-500">Currency</span>
            <span className="text-sm font-bold text-slate-900">PKR (Rs)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
