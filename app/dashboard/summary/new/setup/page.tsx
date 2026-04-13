"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Plus, X, ArrowRight } from "lucide-react";

// --- STRICT TYPES ---
interface BillType {
    _id: string;
    description?: string;
    category?: string;
    amount?: string | number;
    baseAmount?: string | number;
    subTotal?: string | number;
    totalAmount?: string | number;
    unitPrice?: string | number;
    price?: string | number;
    quantity?: string | number;
}

type TaxApplicationTarget = "BaseAmount" | "SubtotalAmount";
type TaxFinancialImpact = "Add" | "DisplayOnly";

interface DBTaxRule {
    name: string;
    percentage: number;
    target?: TaxApplicationTarget;
    impact?: TaxFinancialImpact;
}

interface GlobalAppliedTax {
    id: string;
    name: string;
    percentage: number;
    target: TaxApplicationTarget;
    impact: TaxFinancialImpact;
    calculatedAmount?: number;
}

interface RawTaxRule {
    taxName?: string;
    name?: string;
    title?: string;
    rate?: number | string;
    percentage?: number | string;
    value?: number | string;
    target?: string;
    impact?: string;
    status?: string | boolean;
    isActive?: boolean;
}

// --- HELPERS ---
function parseAmt(val: string | number | undefined | null): number {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const num = Number(val.toString().replace(/,/g, ""));
    return isNaN(num) ? 0 : num;
}

function getBaseAmount(bill: BillType): number {
    const directTotals = [bill.baseAmount, bill.amount, bill.subTotal, bill.totalAmount];
    for (const t of directTotals) {
        const val = parseAmt(t as string | number);
        if (val > 0) return val;
    }
    return (parseAmt(bill.quantity) || 1) * parseAmt(bill.unitPrice || bill.price) || 0;
}

function generateId() { return Math.random().toString(36).substring(2, 9); }

function TaxSetupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientId = searchParams.get("clientId");
    const rawBills = searchParams.get("bills");
    const billIds = useMemo(() => rawBills?.split(",") || [], [rawBills]);

    const [bills, setBills] = useState<BillType[]>([]);
    const [availableTaxRules, setAvailableTaxRules] = useState<DBTaxRule[]>([]);
    const [globalTaxes, setGlobalTaxes] = useState<GlobalAppliedTax[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!clientId || billIds.length === 0) return router.push("/dashboard/summary/new");

        const fetchBills = fetch(`/api/bills?clientId=${clientId}&t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                let extractedBills: BillType[] = [];
                if (Array.isArray(data)) extractedBills = data;
                else if (Array.isArray(data?.data)) extractedBills = data.data;
                else if (Array.isArray(data?.docs)) extractedBills = data.docs;
                else if (Array.isArray(data?.data?.docs)) extractedBills = data.data.docs;
                else if (Array.isArray(data?.bills)) extractedBills = data.bills;

                setBills(extractedBills.filter((b: BillType) => billIds.includes(b._id)));
            });

        const fetchTaxes = fetch(`/api/tax-types?t=${Date.now()}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                // Aggressively find the array in the API response without using the 'any' type
                let rawRules: RawTaxRule[] = [];
                
                if (Array.isArray(data)) {
                    rawRules = data as RawTaxRule[];
                } else if (data && typeof data === 'object') {
                    const dataRecord = data as Record<string, unknown>;
                    
                    if (Array.isArray(dataRecord.data)) rawRules = dataRecord.data as RawTaxRule[];
                    else if (Array.isArray(dataRecord.docs)) rawRules = dataRecord.docs as RawTaxRule[];
                    else if (Array.isArray(dataRecord.taxes)) rawRules = dataRecord.taxes as RawTaxRule[];
                    else if (Array.isArray(dataRecord.rules)) rawRules = dataRecord.rules as RawTaxRule[];
                    else if (dataRecord.data && typeof dataRecord.data === 'object') {
                        const innerData = dataRecord.data as Record<string, unknown>;
                        if (Array.isArray(innerData.docs)) rawRules = innerData.docs as RawTaxRule[];
                    } else {
                        // Fallback: grab the very first array found in the JSON response object
                        const firstArrayObj = Object.values(dataRecord).find(val => Array.isArray(val));
                        if (firstArrayObj) rawRules = firstArrayObj as RawTaxRule[];
                    }
                }

                const mappedRules = rawRules
                    .filter((r) => {
                        if (r.isActive !== undefined) return r.isActive === true;
                        const statusStr = r.status ? String(r.status).toLowerCase() : "active";
                        return statusStr === "active" || statusStr === "true";
                    })
                    .map((r) => ({
                        name: r.taxName || r.name || r.title || "Custom Tax",
                        percentage: parseAmt(r.rate ?? r.percentage ?? r.value ?? 0),
                        target: (r.target as TaxApplicationTarget) || "BaseAmount",
                        // Check if it's income tax to default to DisplayOnly, else Add
                        impact: (r.impact as TaxFinancialImpact) || 
                            (String(r.name || "").toLowerCase().includes("income") ? "DisplayOnly" : "Add")
                    }));
                    
                const finalRules = mappedRules.length > 0 ? mappedRules : [
                    { name: "Service Charges (Fallback)", percentage: 11, target: "SubtotalAmount", impact: "Add" },
                    { name: "Income Tax (Fallback)", percentage: 5.5, target: "BaseAmount", impact: "DisplayOnly" }
                ] as DBTaxRule[];

                setAvailableTaxRules(finalRules);
            })
            .catch(err => {
                console.error("Failed to fetch global taxes:", err);
            });

        Promise.all([fetchBills, fetchTaxes]).finally(() => setIsLoading(false));
    }, [clientId, billIds, router]);

    const updateGlobalTax = (id: string, field: keyof GlobalAppliedTax, value: string | number) => {
        setGlobalTaxes(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const mathResults = useMemo(() => {
        const combinedBillsTotal = bills.reduce((sum, bill) => sum + getBaseAmount(bill), 0);
        let currentSubtotal = combinedBillsTotal;
        let totalIncomeTaxToPay = 0;
        
        type CalculatedRecord = GlobalAppliedTax & { calculatedAmount: number };
        const processedTaxes: CalculatedRecord[] = [];

        globalTaxes.filter(t => t.target === "BaseAmount").forEach(tax => {
            const amount = combinedBillsTotal * (tax.percentage / 100);
            processedTaxes.push({ ...tax, calculatedAmount: amount });
            tax.impact === "DisplayOnly" ? totalIncomeTaxToPay += amount : currentSubtotal += amount;
        });

        globalTaxes.filter(t => t.target === "SubtotalAmount").forEach(tax => {
            const amount = currentSubtotal * (tax.percentage / 100);
            processedTaxes.push({ ...tax, calculatedAmount: amount });
            tax.impact === "DisplayOnly" ? totalIncomeTaxToPay += amount : currentSubtotal += amount;
        });

        return {
            combinedBillsTotal,
            processedTaxes,
            standardTaxesTotal: processedTaxes.filter(t => t.impact === "Add").reduce((sum, t) => sum + t.calculatedAmount, 0),
            totalIncomeTaxToPay,
            finalNetTotal: currentSubtotal
        };
    }, [bills, globalTaxes]);

    const proceedToReview = () => {
        const payload = { clientId, billIds, bills, globalTaxes, mathResults };
        sessionStorage.setItem("pendingSummary", JSON.stringify(payload));
        router.push("/dashboard/summary/new/review");
    };

    if (isLoading) return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" /></div>;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-32">
            <div className="max-w-5xl mx-auto pt-10 px-6 space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 h-10 w-10 p-0 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Step 2: Apply Taxes</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Review base bills and apply global summary taxes.</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
                        <h3 className="text-lg font-bold text-slate-800">Global Summary Taxes</h3>
                        <Button onClick={() => setGlobalTaxes(p => [...p, { id: generateId(), name: "", percentage: 0, target: "BaseAmount", impact: "Add" }])} variant="outline" size="sm" className="font-bold text-[#ea580c] border-orange-200 hover:bg-orange-50 transition-colors">
                            <Plus className="w-4 h-4 mr-2" /> Add Adjustment
                        </Button>
                    </div>

                    {globalTaxes.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 font-medium bg-slate-50/50">No global taxes applied.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                                        <th className="py-4 px-6 font-black w-64">Adjustment Name</th>
                                        <th className="py-4 px-4 font-black w-24">Rate (%)</th>
                                        <th className="py-4 px-4 font-black w-40">Calculate On</th>
                                        <th className="py-4 px-4 font-black text-center w-36">Exclude from Total</th>
                                        <th className="py-4 px-6 font-black text-right w-36">Amount</th>
                                        <th className="py-4 px-4 font-black w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {globalTaxes.map((tax) => {
                                        const calculatedAmount = mathResults.processedTaxes.find(t => t.id === tax.id)?.calculatedAmount || 0;
                                        return (
                                            <tr key={tax.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-3 px-6">
                                                    <select 
                                                        value={tax.name} 
                                                        onChange={(e) => {
                                                            const ruleName = e.target.value;
                                                            const rule = availableTaxRules.find(r => r.name === ruleName);
                                                            updateGlobalTax(tax.id, "name", ruleName);
                                                            if (rule) {
                                                                updateGlobalTax(tax.id, "percentage", rule.percentage);
                                                                updateGlobalTax(tax.id, "target", rule.target || "BaseAmount");
                                                                updateGlobalTax(tax.id, "impact", rule.impact || "Add");
                                                            }
                                                        }} 
                                                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 outline-none"
                                                    >
                                                        <option value="" disabled>Select a saved tax...</option>
                                                        {availableTaxRules.map((r) => (
                                                            <option key={r.name} value={r.name}>{r.name} ({r.percentage}%)</option>
                                                        ))}
                                                        <option value="Custom Tax">Create Custom Tax...</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input 
                                                        type="number" 
                                                        value={tax.percentage} 
                                                        onChange={(e) => updateGlobalTax(tax.id, "percentage", e.target.value)} 
                                                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 outline-none text-right" 
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <select 
                                                        value={tax.target} 
                                                        onChange={(e) => updateGlobalTax(tax.id, "target", e.target.value)} 
                                                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                                                    >
                                                        <option value="BaseAmount">Base Total</option>
                                                        <option value="SubtotalAmount">Subtotal</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => updateGlobalTax(tax.id, "impact", tax.impact === "DisplayOnly" ? "Add" : "DisplayOnly")} 
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tax.impact === "DisplayOnly" ? 'bg-[#ea580c]' : 'bg-slate-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tax.impact === "DisplayOnly" ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </td>
                                                <td className="py-3 px-6 text-right font-bold">Rs {calculatedAmount.toLocaleString("en-PK")}</td>
                                                <td className="py-3 px-4">
                                                    <Button variant="ghost" size="icon" onClick={() => setGlobalTaxes(p => p.filter(t => t.id !== tax.id))} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-0 left-64 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-6 px-10 flex justify-between items-center z-20">
                <div className="flex gap-12">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Combined Base</p>
                        <p className="text-lg font-bold text-slate-700">Rs {mathResults.combinedBillsTotal.toLocaleString("en-PK")}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#ea580c] uppercase tracking-wider mb-1">Standard Taxes</p>
                        <p className="text-lg font-bold text-[#ea580c]">Rs {mathResults.standardTaxesTotal.toLocaleString("en-PK")}</p>
                    </div>
                    <div className="pl-8 border-l border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Payable</p>
                        <p className="text-3xl font-black text-slate-900">Rs {mathResults.finalNetTotal.toLocaleString("en-PK")}</p>
                    </div>
                </div>
                <Button onClick={proceedToReview} className="bg-[#ea580c] text-white hover:bg-[#d44d0a] hover:shadow-lg hover:shadow-orange-500/20 px-10 h-14 text-base font-black transition-all rounded-xl">
                    Review Summary <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
            </div>
        </div>
    );
}

export default function GenerateSummaryPage() {
    return (
        <Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" /></div>}>
            <TaxSetupContent />
        </Suspense>
    );
}