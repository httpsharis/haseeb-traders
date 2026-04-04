"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ArrowLeft, Percent, Plus, X, ArrowRight, Printer, Receipt } from "lucide-react";

type BillItem = {
  amount?: string | number;
  total?: string | number;
  quantity?: string | number;
  price?: string | number;
  unitPrice?: string | number;
  rate?: string | number;
};

type BillType = {
  _id: string;
  billNumber?: string;
  invoiceNumber?: string;
  description?: string;
  category?: string;
  date?: string;
  amount?: string | number;
  baseAmount?: string | number;
  subTotal?: string | number;
  totalAmount?: string | number;
  netAmount?: string | number;
  total?: string | number;
  quantity?: string | number;
  unitPrice?: string | number;
  price?: string | number;
  items?: BillItem[];
};

type TaxRule = { name: string; percentage: number };
type AppliedTax = { id: string; name: string; percentage: number | string };

type RawTaxRule = {
  taxName?: string;
  name?: string;
  rate?: string | number;
  percentage?: string | number;
  status?: string | boolean;
};

function parseAmt(val: string | number | undefined | null): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const num = Number(val.toString().replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

function getBaseAmount(bill: BillType): number {
  const directTotals = [bill.baseAmount, bill.amount, bill.subTotal, bill.totalAmount, bill.netAmount, bill.total];
  for (const t of directTotals) {
    const val = parseAmt(t);
    if (val > 0) return val;
  }

  if (Array.isArray(bill.items) && bill.items.length > 0) {
    let sum = 0;
    bill.items.forEach((item) => {
      const itemTotal = parseAmt(item.amount) || parseAmt(item.total) || ( (parseAmt(item.quantity) || 1) * parseAmt(item.price || item.unitPrice || item.rate) );
      sum += itemTotal;
    });
    if (sum > 0) return sum;
  }

  const flat = (parseAmt(bill.quantity) || 1) * parseAmt(bill.unitPrice || bill.price);
  return flat > 0 ? flat : 0;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function TaxSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const rawBills = searchParams.get("bills");
  const billIds = useMemo(() => rawBills?.split(",") || [], [rawBills]);

  const [step, setStep] = useState<"SETUP" | "REVIEW">("SETUP");
  const [bills, setBills] = useState<BillType[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [taxConfigs, setTaxConfigs] = useState<Record<string, AppliedTax[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!clientId || billIds.length === 0) {
      router.push("/dashboard/summary/new");
      return;
    }

    // FIX: Removed the ?status=Unbilled filter here as well
    fetch(`/api/bills?clientId=${clientId}&t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        const allBills = Array.isArray(data) ? data : (data.bills || data.data || []);
        const selected = allBills.filter((b: BillType) => billIds.includes(b._id));
        setBills(selected);

        const initialTaxes: Record<string, AppliedTax[]> = {};
        selected.forEach((b: BillType) => {
          initialTaxes[b._id] = [];
        });
        setTaxConfigs(initialTaxes);
      })
      .catch((err) => console.error(err));

    fetch(`/api/tax-rules?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("API request failed");
        return res.json();
      })
      .then((data) => {
        const rawRules = Array.isArray(data) ? data : data.rules || data.data || data.taxes || [];
        const mappedRules = rawRules
          .filter((r: RawTaxRule) => r.status !== "Inactive" && r.status !== false)
          .map((r: RawTaxRule) => ({
            name: r.taxName || r.name || "Custom Tax",
            percentage: parseAmt(r.rate || r.percentage)
          }));

        if (mappedRules.length > 0) setTaxRules(mappedRules);
        else throw new Error("No valid tax rules");
      })
      .catch(() => {
        setTaxRules([
          { name: "GST", percentage: 18 },
          { name: "Income Tax", percentage: 5.5 },
          { name: "PST", percentage: 16 },
          { name: "Service Charges", percentage: 11 }
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [clientId, billIds, router]);

  const addTaxRow = (billId: string) => {
    setTaxConfigs((prev) => ({
      ...prev,
      [billId]: [...(prev[billId] || []), { id: generateId(), name: "Select Tax...", percentage: 0 }],
    }));
  };

  const removeTaxRow = (billId: string, taxId: string) => {
    setTaxConfigs((prev) => ({
      ...prev,
      [billId]: prev[billId].filter((t) => t.id !== taxId),
    }));
  };

  const updateTaxRow = (billId: string, taxId: string, field: keyof AppliedTax, value: string | number) => {
    setTaxConfigs((prev) => ({
      ...prev,
      [billId]: prev[billId].map((t) => (t.id === taxId ? { ...t, [field]: value } : t)),
    }));
  };

  const calculateTotals = () => {
    let totalBase = 0;
    let totalTax = 0;

    const previewBills = bills.map((bill) => {
      const rawConfigs = taxConfigs[bill._id];
      const configs = Array.isArray(rawConfigs) ? rawConfigs : [];

      const base = getBaseAmount(bill);
      const totalPercentage = configs.reduce((sum, tax) => sum + parseAmt(tax.percentage), 0);
      const taxAmt = (base * totalPercentage) / 100;

      totalBase += base;
      totalTax += taxAmt;

      return {
        ...bill,
        calculatedTax: taxAmt,
        finalAmount: base + taxAmt,
        baseValue: base,
        appliedTaxes: configs,
      };
    });

    return { previewBills, totalBase, totalTax, netPayable: totalBase + totalTax };
  };

  const { previewBills, totalBase, totalTax, netPayable } = calculateTotals();

  const handleFinalize = async () => {
    setIsSaving(true);
    try {
      const billUpdatePromises = previewBills.map((bill) => {
        const rawConfigs = taxConfigs[bill._id];
        const configs = Array.isArray(rawConfigs) ? rawConfigs : [];
        const totalPct = configs.reduce((sum, t) => sum + parseAmt(t.percentage), 0);
          
        const taxItems = configs.map((c) => ({ 
          name: c.name === "Select Tax..." ? "Custom Tax" : c.name, 
          percentage: parseAmt(c.percentage), 
          amount: (bill.baseValue * parseAmt(c.percentage)) / 100 
        }));

        const billTaxAmt = (bill.baseValue * totalPct) / 100;
        const billFinalAmt = bill.baseValue + billTaxAmt;

        return fetch("/api/bills", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: bill._id,
            taxAmount: billTaxAmt,
            amount: billFinalAmt,
            taxes: taxItems
          })
        });
      });

      await Promise.all(billUpdatePromises);

      const summaryPayload = {
        client: clientId,
        summaryNumber: "SUM-" + Date.now(),
        date: new Date().toISOString(),
        taxPeriod: "Per Bill Breakdown",
        bills: billIds,
        summarySubTotal: totalBase,
        totalTaxAmount: totalTax,
        netPayable: netPayable,
        status: "Draft",
      };

      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryPayload),
      });

      if (res.ok) {
        window.print();
        setTimeout(() => router.push("/dashboard/summary"), 500);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-[#ea580c] rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Setup...</p>
        </div>
      </div>
    );
  }

  // --- REVIEW SUMMARY UI ---
  if (step === "REVIEW") {
    return (
      <div className="max-w-[850px] mx-auto pt-10 px-6 space-y-8 pb-32 print:p-0 print:m-0 print:max-w-full">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" onClick={() => setStep("SETUP")} className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tax Setup
          </Button>
          <Button onClick={handleFinalize} disabled={isSaving} className="bg-[#ea580c] text-white hover:bg-[#d44d0a] h-12 px-8 font-black rounded-xl">
            {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Printer className="w-5 h-5 mr-3" />}
            {isSaving ? "Saving..." : "Save & Print Summary"}
          </Button>
        </div>

        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
          <div className="flex justify-between items-end border-b border-slate-200 pb-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-orange-50 rounded-xl flex items-center justify-center print:hidden">
                <Receipt className="w-7 h-7 text-[#ea580c]" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Summary Preview</h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Ready for Print</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
              <p className="text-4xl font-black text-[#ea580c]">Rs {netPayable.toLocaleString("en-PK")}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-10">
            <thead className="bg-slate-50 border-b border-slate-200 print:bg-transparent print:border-black">
              <tr>
                <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Category / Details</th>
                <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Base Value</th>
                <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Applied Tax</th>
                <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Final Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {previewBills.map((bill) => {
                const displayTitle = bill.category || bill.description || `Bill #${bill._id.substring(0, 6).toUpperCase()}`;

                return (
                  <tr key={bill._id} className="align-top">
                    <td className="py-6 px-4">
                      <p className="font-bold text-slate-900 text-lg">{displayTitle}</p>
                      
                      {bill.appliedTaxes.length > 0 ? (
                        <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 print:border-slate-200">
                          {bill.appliedTaxes.map((tax, i) => (
                            <p key={i} className="text-xs font-medium text-slate-500">
                              + {tax.name === "Select Tax..." ? "Tax" : tax.name} ({tax.percentage}%)
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-400 mt-2 border-t border-slate-100 pt-2">No taxes applied</p>
                      )}
                    </td>
                    <td className="py-6 px-4 text-right font-medium text-slate-600">Rs {bill.baseValue.toLocaleString("en-PK")}</td>
                    <td className="py-6 px-4 text-right font-bold text-[#ea580c]">
                      {bill.calculatedTax > 0 ? `Rs ${bill.calculatedTax.toLocaleString("en-PK")}` : "—"}
                    </td>
                    <td className="py-6 px-4 text-right font-black text-slate-900 text-lg">Rs {bill.finalAmount.toLocaleString("en-PK")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-end pt-8 border-t border-slate-200 print:border-black">
            <div className="w-72 space-y-4">
              <div className="flex justify-between text-base font-bold text-slate-500">
                <span>Subtotal Base</span>
                <span>Rs {totalBase.toLocaleString("en-PK")}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#ea580c]">
                <span>Total Taxes</span>
                <span>Rs {totalTax.toLocaleString("en-PK")}</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-slate-900 pt-4 border-t border-slate-200 print:border-black">
                <span>Net Payable</span>
                <span>Rs {netPayable.toLocaleString("en-PK")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SETUP UI ---
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-32">
      <div className="max-w-[1100px] mx-auto pt-10 px-6 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 h-10 w-10 p-0 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Step 2: Apply Taxes</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Configure tax rules for each bill.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
            <thead className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
              <tr>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-[25%]">Category / Details</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-[20%]">Base Amount</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-[35%]">Applied Taxes</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right w-[20%]">Final Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewBills.map((bill) => {
                const appliedTaxes = taxConfigs[bill._id] || [];
                const displayTitle = bill.category || bill.description || `Bill #${bill._id.substring(0, 6).toUpperCase()}`;

                return (
                  <tr key={bill._id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="py-6 px-6">
                      <div className="font-bold text-slate-900 text-lg">{displayTitle}</div>
                    </td>
                    
                    <td className="py-6 px-6">
                      <div className="text-base font-bold text-slate-600">
                        Rs {bill.baseValue.toLocaleString("en-PK")}
                      </div>
                    </td>
                    
                    <td className="py-6 px-6">
                      <div className="flex flex-col gap-3">
                        {appliedTaxes.map((tax) => (
                          <div key={tax.id} className="flex items-center gap-2">
                            <select
                              value={taxRules.some((r) => r.name === tax.name) ? tax.name : (tax.name === "Select Tax..." ? "" : "Custom Tax")}
                              onChange={(e) => {
                                const selectedName = e.target.value;
                                const rule = taxRules.find((t) => t.name === selectedName);
                                updateTaxRow(bill._id, tax.id, "name", selectedName);
                                if (rule) updateTaxRow(bill._id, tax.id, "percentage", rule.percentage);
                              }}
                              className="w-40 p-2 border border-slate-200 rounded-lg text-sm font-medium bg-slate-50 outline-none focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer"
                            >
                              <option value="" disabled>Select Tax...</option>
                              {taxRules.map((rule) => (
                                <option key={rule.name} value={rule.name}>{rule.name}</option>
                              ))}
                              <option value="Custom Tax">Custom Tax...</option>
                            </select>

                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={tax.percentage}
                                onChange={(e) => updateTaxRow(bill._id, tax.id, "percentage", e.target.value)}
                                className="w-20 p-2 pr-7 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 outline-none focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-right"
                              />
                              <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5" />
                            </div>

                            <Button variant="ghost" size="icon" onClick={() => removeTaxRow(bill._id, tax.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        <div>
                          <Button variant="outline" size="sm" onClick={() => addTaxRow(bill._id)} className="h-8 text-xs font-bold border-dashed border-slate-300 text-slate-500 hover:text-[#ea580c] hover:border-orange-300 hover:bg-orange-50 transition-colors">
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Tax
                          </Button>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-6 px-6 text-right">
                      <div className="font-black text-slate-900 text-xl">Rs {bill.finalAmount.toLocaleString("en-PK")}</div>
                      {bill.calculatedTax > 0 ? (
                        <div className="text-xs font-bold text-[#ea580c] mt-1">+ Rs {bill.calculatedTax.toLocaleString("en-PK")} total tax</div>
                      ) : (
                        <div className="text-xs font-bold text-slate-400 mt-1">No tax applied</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-6 px-10 flex justify-between items-center z-20">
        <div className="flex gap-12">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subtotal</p>
            <p className="text-lg font-bold text-slate-700">Rs {totalBase.toLocaleString("en-PK")}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#ea580c] uppercase tracking-wider mb-1">Total Tax</p>
            <p className="text-lg font-bold text-[#ea580c]">Rs {totalTax.toLocaleString("en-PK")}</p>
          </div>
          <div className="pl-8 border-l border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Payable</p>
            <p className="text-3xl font-black text-slate-900">Rs {netPayable.toLocaleString("en-PK")}</p>
          </div>
        </div>

        <Button onClick={() => setStep("REVIEW")} className="bg-[#ea580c] text-white hover:bg-[#d44d0a] hover:shadow-lg hover:shadow-orange-500/20 px-10 h-14 text-base font-black transition-all rounded-xl">
          Review Summary <ArrowRight className="w-5 h-5 ml-3" />
        </Button>
      </div>
    </div>
  );
}

export default function GenerateSummaryPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
      </div>
    }>
      <TaxSetupContent />
    </Suspense>
  );
}