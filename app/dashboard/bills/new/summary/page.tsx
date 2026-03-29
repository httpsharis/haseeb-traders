"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Printer, FileText, FileSpreadsheet, CheckCircle2, ArrowLeft, Search, Info, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useWizard,
  calculateItemTotal,
  calculateItemTaxTotal,
  calculateGrandTotal,
} from "@/components/bills";

// Helper to format money
function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function SummaryPage() {
  const router = useRouter();
  const { data, reset } = useWizard();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Redirect if no data
  useEffect(() => {
    if (!data.clientId || data.items.length === 0) {
      router.push("/dashboard/bills/new");
    }
  }, [data.clientId, data.items.length, router]);

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalTax = data.items.reduce((sum, item) => sum + calculateItemTaxTotal(item), 0);
  const grandTotal = calculateGrandTotal(data.items, data.discount);

  // Group taxes by name for summary
  const taxSummary: Record<string, number> = {};
  data.items.forEach((item) => {
    item.taxes?.forEach((tax) => {
      taxSummary[tax.name] = (taxSummary[tax.name] || 0) + tax.amount;
    });
  });

  // Save to database
  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const bills = data.items.map((item, idx) => ({
        billNumber: item.billNumber || `${data.summaryNumber}-${idx + 1}`,
        date: item.date || data.date,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxes: item.taxes,
      }));

      const payload = {
        client: data.clientId,
        summaryNumber: data.summaryNumber,
        date: data.date,
        taxPeriod: data.taxPeriod,
        status: "Draft",
        discount: data.discount,
        commission: data.commission,
        bills,
      };

      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }

    setSaving(false);
  };

  // Export to Excel (CSV format)
  const handleExport = () => {
    const rows: string[][] = [];
    rows.push(["Invoice Summary"]);
    rows.push(["Client", data.clientName]);
    rows.push(["Bill #", data.summaryNumber]);
    rows.push(["Date", data.date]);
    rows.push(["Tax Period", data.taxPeriod]);
    rows.push([]);
    rows.push(["#", "Description", "Category", "QTY", "Unit Price", "Amount", "Tax", "Total"]);

    data.items.forEach((item, idx) => {
      const amount = calculateItemTotal(item);
      const tax = calculateItemTaxTotal(item);
      rows.push([
        String(idx + 1),
        item.description,
        item.category,
        String(item.quantity),
        String(item.unitPrice),
        String(amount),
        String(tax),
        String(amount + tax),
      ]);
    });

    rows.push([]);
    rows.push(["Tax Breakdown"]);
    Object.entries(taxSummary).forEach(([name, amount]) => {
      rows.push([name, String(amount)]);
    });

    rows.push([]);
    rows.push(["Subtotal", String(subtotal)]);
    rows.push(["Total Tax", String(totalTax)]);
    if (data.discount > 0) {
      rows.push(["Discount", String(-data.discount)]);
    }
    rows.push(["Grand Total", String(grandTotal)]);

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${data.summaryNumber}_${data.clientName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!data.clientId || data.items.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 print:m-0 print:p-0">
      
      {/* Header - Hidden on Print */}
      <div className="print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice (Step 4)</h1>
        <p className="mt-2 text-muted-foreground">Review your invoice details before finalizing and saving.</p>
        
        {/* Simple Progress Bar */}
        <div className="mt-8 flex items-center justify-between text-sm font-medium">
          <span className="text-[#ea580c]">Step 4: Preview & Export</span>
          <span className="text-slate-600">100% Completed</span>
        </div>
        <div className="mt-2 flex h-2 w-full gap-2">
          <div className="h-full flex-1 rounded-full bg-[#ea580c]"></div>
          <div className="h-full flex-1 rounded-full bg-[#ea580c]"></div>
          <div className="h-full flex-1 rounded-full bg-[#ea580c]"></div>
          <div className="h-full flex-1 rounded-full bg-[#ea580c]"></div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 print:block print:w-full">
        
        {/* Left Column: Document Preview */}
        <div className="lg:col-span-2 print:col-span-3">
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm print:rounded-none print:border-none print:shadow-none">
            
            {/* Toolbar - Hidden on Print */}
            <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground print:hidden">
              <span>Document Preview: INV-{data.summaryNumber}</span>
              <div className="flex items-center gap-2">
                <Search className="size-3" />
                <span>100%</span>
              </div>
            </div>

            {/* Actual Paper Document */}
            <div className="p-12 print:p-0">
              
              {/* Top Section */}
              <div className="flex justify-between items-start mb-16">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Haseeb Traders</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Main Business Market<br />
                    Multan, Pakistan
                  </p>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-light tracking-widest text-slate-300 uppercase">Invoice</h1>
                  <p className="mt-4 text-sm font-bold text-slate-900"># {data.summaryNumber}</p>
                  <p className="text-sm text-slate-500">Date: {data.date}</p>
                </div>
              </div>

              {/* Bill To & Payment Info */}
              <div className="grid grid-cols-2 gap-12 mb-12 text-sm">
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Bill To</h3>
                  <p className="font-bold text-slate-900">{data.clientName}</p>
                  <p className="mt-1 text-slate-500">Tax Period: {data.taxPeriod}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Payment Details</h3>
                  <p className="text-slate-500">Bank: Standard Chartered</p>
                  <p className="text-slate-500">IBAN: PK34 SCBL 0000 1234 5678 90</p>
                </div>
              </div>

              {/* Clean Table */}
              <table className="w-full text-sm mb-8">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-left">
                    <th className="py-3 font-bold uppercase tracking-wider text-slate-900 text-xs">Description</th>
                    <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs">Qty</th>
                    <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs">Unit Price</th>
                    <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-4 font-medium text-slate-900">
                        {item.description}
                        <p className="text-xs text-slate-500 font-normal">{item.category}</p>
                      </td>
                      <td className="py-4 text-right text-slate-600">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-600">{formatMoney(item.unitPrice)}</td>
                      <td className="py-4 text-right font-bold text-slate-900">{formatMoney(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="flex justify-end">
                <div className="w-64 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  
                  {Object.entries(taxSummary).map(([name, amount]) => (
                    <div key={name} className="flex justify-between text-slate-600">
                      <span>{name}</span>
                      <span>{formatMoney(amount)}</span>
                    </div>
                  ))}

                  {data.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount</span>
                      <span>-{formatMoney(data.discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t-2 border-slate-900 pt-3 text-lg font-bold text-[#ea580c]">
                    <span className="text-slate-900">Total Amount</span>
                    <span>{formatMoney(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-32 flex items-end justify-between border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold tracking-widest text-slate-300 uppercase">Haseeb Traders | Verified Electronic Document</p>
                <div className="size-10 bg-slate-100 rounded flex items-center justify-center">
                   <Search className="size-5 text-slate-300" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Actions & Summary - Hidden on Print */}
        <div className="space-y-6 print:hidden">
          
          <Card className="border shadow-sm">
            <CardContent className="p-6 space-y-6">
              
              <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Rocket className="size-5 text-[#ea580c]" />
                <h3>Actions</h3>
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">{error}</div>}
              {saved && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-200">Invoice saved successfully!</div>}

              <div className="space-y-3">
                {!saved ? (
                  <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-[#ea580c] hover:bg-[#ea580c]/90 text-md font-bold">
                    <CheckCircle2 className="mr-2 size-5" />
                    {saving ? "Saving..." : "Finalize & Save"}
                  </Button>
                ) : (
                  <Button onClick={() => router.push("/dashboard")} className="w-full h-12 bg-green-600 hover:bg-green-700 text-md font-bold">
                    Go to Dashboard
                  </Button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handlePrint} className="h-11 border-slate-200 text-slate-700">
                    <Printer className="mr-2 size-4" /> Print
                  </Button>
                  <Button variant="outline" onClick={handleExport} className="h-11 border-slate-200 text-slate-700">
                    <FileSpreadsheet className="mr-2 size-4" /> Export CSV
                  </Button>
                </div>

                <Button variant="outline" onClick={() => router.push("/dashboard/bills/new")} className="w-full h-11 border-slate-200 text-slate-700">
                  <FileText className="mr-2 size-4" /> Save as Draft / New
                </Button>
              </div>

              <div className="pt-6 border-t space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Recipient</span>
                    <span className="font-bold text-slate-900">{data.clientName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Total Items</span>
                    <span className="font-bold text-slate-900">{data.items.length} Lines</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">Currency</span>
                    <span className="font-bold text-slate-900">PKR (Rs)</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          <button onClick={() => router.push("/dashboard/bills/new/taxes")} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="mr-2 size-4" /> Back to Taxes & Adjustments
          </button>

          <div className="rounded-lg bg-orange-50/50 border border-orange-100 p-4 flex gap-3 text-sm text-orange-800">
            <Info className="size-5 shrink-0 mt-0.5 text-[#ea580c]" />
            <p>Once finalized, this invoice will be assigned a permanent status and can be tracked in your dashboard.</p>
          </div>

        </div>

      </div>
    </div>
  );
}