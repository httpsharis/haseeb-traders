"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Percent, Save, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TaxRule {
  _id: string;
  name: string;
  percentage: number;
  isActive: boolean;
}

interface TaxCharge {
  name: string;
  percentage: number;
  baseAmount: number;
  amount: number;
}

interface Bill {
  _id: string;
  billNumber: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  taxes: TaxCharge[];
  date: string;
}

interface Summary {
  _id: string;
  summaryNumber: string;
  client: { _id: string; name: string };
  date: string;
  taxPeriod: string;
  status: string;
  discount: number;
  commission: number;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProcessPendingBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Tax Selections: { ruleId: { active, percentage, manualAmount, useManual } }
  const [globalTaxes, setGlobalTaxes] = useState<
    Record<string, { active: boolean; percentage: number; manualAmount: number | null; useManual: boolean }>
  >({});

  const [finalizing, setFinalizing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, taxRes] = await Promise.all([
        fetch(`/api/summaries/${id}`),
        fetch("/api/tax-types"),
      ]);
      const summaryData = await summaryRes.json();
      const taxData = await taxRes.json();

      setSummary(summaryData.summary);
      setBills(summaryData.bills || []);
      
      const activeRules = Array.isArray(taxData) ? taxData.filter((t: TaxRule) => t.isActive) : [];
      setTaxRules(activeRules);

      // Pre-select taxes if bills already have them saved globally
      const initialGlobalTaxes: Record<string, { active: boolean; percentage: number; manualAmount: number | null; useManual: boolean }> = {};
      if (summaryData.bills && summaryData.bills.length > 0) {
        // Aggregate taxes from all bills to detect which taxes were applied
        const allBillTaxes = summaryData.bills[0].taxes || [];
        allBillTaxes.forEach((tax: TaxCharge) => {
          const matchingRule = activeRules.find((r: TaxRule) => r.name === tax.name);
          if (matchingRule) {
            // Sum the tax amounts across all bills to get the total manual amount
            const totalTaxAmount = summaryData.bills.reduce((sum: number, b: Bill) => {
              const bt = (b.taxes || []).find((t: TaxCharge) => t.name === tax.name);
              return sum + (bt?.amount || 0);
            }, 0);

            const billsSubtotal = summaryData.bills.reduce((sum: number, b: Bill) => sum + b.quantity * b.unitPrice, 0);
            const computedAmount = billsSubtotal * (tax.percentage / 100);
            const isManual = Math.abs(totalTaxAmount - computedAmount) > 0.01;

            initialGlobalTaxes[matchingRule._id] = {
              active: true,
              percentage: tax.percentage,
              manualAmount: isManual ? totalTaxAmount : null,
              useManual: isManual,
            };
          }
        });
      }
      setGlobalTaxes(initialGlobalTaxes);
      
    } catch {
      alert("Failed to load data.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleTax = (ruleId: string, defaultPercentage: number) => {
    setGlobalTaxes((prev) => {
      const isCurrentlyActive = prev[ruleId]?.active;
      return {
        ...prev,
        [ruleId]: {
          active: !isCurrentlyActive,
          percentage: prev[ruleId]?.percentage || defaultPercentage,
          manualAmount: null,
          useManual: false,
        },
      };
    });
  };

  const updateTaxPercentage = (ruleId: string, percentage: number) => {
    setGlobalTaxes((prev) => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        percentage,
      },
    }));
  };

  const updateManualAmount = (ruleId: string, amount: number) => {
    setGlobalTaxes((prev) => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        manualAmount: amount,
      },
    }));
  };

  const toggleManualMode = (ruleId: string) => {
    setGlobalTaxes((prev) => {
      const current = prev[ruleId];
      const newUseManual = !current?.useManual;
      return {
        ...prev,
        [ruleId]: {
          ...current,
          useManual: newUseManual,
          manualAmount: newUseManual ? (current.manualAmount ?? subtotal * (current.percentage / 100)) : null,
        },
      };
    });
  };

  const subtotal = bills.reduce((sum, b) => sum + b.quantity * b.unitPrice, 0);

  // Calculate global applied taxes
  const appliedTaxes = Object.entries(globalTaxes)
    .filter(([, sel]) => sel.active)
    .map(([ruleId, sel]) => {
      const rule = taxRules.find((r) => r._id === ruleId);
      const computedAmount = subtotal * (sel.percentage / 100);
      const finalAmount = sel.useManual && sel.manualAmount !== null ? sel.manualAmount : computedAmount;
      return {
        ruleId,
        name: rule?.name || "Tax",
        percentage: sel.percentage,
        amount: finalAmount,
        isManual: sel.useManual,
      };
    });

  const totalTaxAmount = appliedTaxes.reduce((sum, t) => sum + t.amount, 0);
  const grandTotal = subtotal + totalTaxAmount - (summary?.discount || 0);

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      // Step 1: Distribute global taxes to individual bills and save them
      for (const bill of bills) {
        const billAmount = bill.quantity * bill.unitPrice;
        const proportion = subtotal > 0 ? billAmount / subtotal : 0;
        
        // Calculate the taxes proportionally for this specific bill
        const specificBillTaxes = appliedTaxes.map(tax => ({
          name: tax.name,
          percentage: tax.percentage,
          baseAmount: tax.isManual ? tax.amount * proportion : billAmount,
          amount: tax.isManual ? tax.amount * proportion : billAmount * (tax.percentage / 100),
        }));

        await fetch(`/api/bills/${bill._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taxes: specificBillTaxes }),
        });
      }

      // Step 2: Mark summary as Converted
      const res = await fetch(`/api/summaries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Converted" }),
      });
      if (!res.ok) throw new Error("Failed to finalize summary.");
      
      router.push("/dashboard/summaries");
    } catch {
      alert("Failed to finalize.");
    }
    setFinalizing(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!summary) return <div className="text-center text-slate-500 mt-10">Summary not found.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Back + Header */}
      <button onClick={() => router.push("/dashboard/pending-bills")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="size-4" /> Back to Pending Bills
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Process Bill #{summary.summaryNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {summary.client?.name} • {summary.taxPeriod} • {formatDate(summary.date)}
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-sm px-3 py-1">{summary.status}</Badge>
      </div>

      {/* Bill Items Listing */}
      <div className="space-y-4">
        {bills.map((bill) => {
          const billAmount = bill.quantity * bill.unitPrice;
          return (
            <Card key={bill._id} className="border shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    {bill.description}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{bill.category}</p>
                </div>
                <div className="text-sm font-semibold text-slate-700 text-right">
                  <div className="text-slate-500 font-normal mb-1">
                    {bill.quantity} × {formatMoney(bill.unitPrice)}
                  </div>
                  <span className="text-slate-900 border-t border-slate-100 pt-1 inline-block">
                    {formatMoney(billAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* GLOBAL TAX CONFIGURATION */}
      <Card className="border shadow-sm bg-slate-50/50">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <Percent className="size-5 text-[#ea580c]" />
            <CardTitle className="text-lg text-slate-800">Apply Taxes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {taxRules.length === 0 ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
              No tax rules configured yet. Add them in{" "}
              <button onClick={() => router.push("/dashboard/tax-rules")} className="underline font-medium">
                Master Settings → Tax Rules
              </button>.
            </div>
          ) : (
            <>
              {/* Tax Toggles */}
              <div className="flex flex-wrap gap-2">
                {taxRules.map((rule) => {
                  const isActive = globalTaxes[rule._id]?.active || false;
                  return (
                    <button
                      key={rule._id}
                      onClick={() => toggleTax(rule._id, rule.percentage)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "border-[#ea580c] bg-orange-50 text-[#ea580c]"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {isActive ? <Check className="size-4" /> : <div className="size-4 rounded-full border border-slate-300" />}
                      {rule.name}
                    </button>
                  );
                })}
              </div>

              {/* Editable Inputs for active taxes */}
              {appliedTaxes.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  {appliedTaxes.map((tax) => {
                    const isManual = tax.isManual;
                    return (
                      <div key={tax.ruleId} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-800">{tax.name}</h4>
                          <button
                            onClick={() => toggleManualMode(tax.ruleId)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              isManual
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <PenLine className="size-3" />
                            {isManual ? "Manual Mode" : "Auto Mode"}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Percentage (%)
                            </label>
                            <Input
                              type="number"
                              step="0.1"
                              value={tax.percentage || ""}
                              onChange={(e) => updateTaxPercentage(tax.ruleId, parseFloat(e.target.value) || 0)}
                              className="h-10 text-sm bg-white"
                              disabled={isManual}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              {isManual ? "Tax Amount (PKR) — Manual" : "Tax Amount (PKR) — Auto"}
                            </label>
                            {isManual ? (
                              <Input
                                type="number"
                                value={globalTaxes[tax.ruleId]?.manualAmount ?? ""}
                                onChange={(e) => updateManualAmount(tax.ruleId, parseFloat(e.target.value) || 0)}
                                className="h-10 text-sm bg-blue-50/50 border-blue-200 focus-visible:ring-blue-300"
                              />
                            ) : (
                              <div className="h-10 flex items-center px-3 rounded-md bg-slate-100 text-sm font-semibold text-slate-700 border border-slate-200">
                                {formatMoney(tax.amount)}
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Calculated
                            </label>
                            <div className="h-10 flex items-center px-3 rounded-md bg-slate-50 text-sm font-semibold text-slate-700 border border-slate-100">
                              {formatMoney(tax.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* FINAL SETTLEMENT SUMMARY */}
      <Card className="border-2 border-[#ea580c]/20 shadow-sm mt-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            <div className="space-y-3 w-full max-w-sm">
              <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Total Items ({bills.length}):</span>
                <span className="font-semibold text-slate-800">{formatMoney(subtotal)}</span>
              </div>
              
              {appliedTaxes.map(tax => (
                <div key={tax.ruleId} className="flex justify-between items-center text-sm text-slate-600">
                  <span>
                    {tax.name} ({tax.percentage}%)
                    {tax.isManual && <span className="ml-1 text-[10px] text-blue-600 font-medium">(manual)</span>}
                    :
                  </span>
                  <span className="font-semibold text-slate-800">{formatMoney(tax.amount)}</span>
                </div>
              ))}

              {summary.discount > 0 && (
                <div className="flex justify-between items-center text-sm text-red-500 pt-2 border-t border-slate-100">
                  <span>Discount:</span>
                  <span className="font-semibold">-{formatMoney(summary.discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-3 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-[#ea580c]">PKR {formatMoney(grandTotal)}</span>
              </div>
            </div>

            <Button
              className="h-14 px-8 gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-base font-bold w-full md:w-auto shadow-md"
              onClick={handleFinalize}
              disabled={finalizing}
            >
              <Save className="size-5" />
              {finalizing ? "Finalizing..." : "Finalize & Convert Summary"}
            </Button>
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
