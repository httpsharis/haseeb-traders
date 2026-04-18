"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { 
    BillType, DBTaxRule, GlobalAppliedTax, RawTaxRule, 
    parseAmt, getBaseAmount 
} from "@/lib/summaryHelper";
import { GlobalTaxTable } from "@/components/features/summaries/GlobelTaxTable";

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

    // --- DATA FETCHING ---
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
                        target: (r.target as "BaseAmount" | "SubtotalAmount") || "BaseAmount",
                        impact: (r.impact as "Add" | "DisplayOnly") || 
                            (String(r.name || "").toLowerCase().includes("income") ? "DisplayOnly" : "Add")
                    }));
                    
                const finalRules = mappedRules.length > 0 ? mappedRules : [
                    { name: "Service Charges (Fallback)", percentage: 11, target: "SubtotalAmount", impact: "Add" },
                    { name: "Income Tax (Fallback)", percentage: 5.5, target: "BaseAmount", impact: "DisplayOnly" }
                ] as DBTaxRule[];

                setAvailableTaxRules(finalRules);
            })
            .catch(console.error);

        Promise.all([fetchBills, fetchTaxes]).finally(() => setIsLoading(false));
    }, [clientId, billIds, router]);

    // --- STATE UPDATES & MATH ENGINE ---
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
            
            // ✅ FIX: Replaced ternary with strict if/else
            if (tax.impact === "DisplayOnly") {
                totalIncomeTaxToPay += amount;
            } else {
                currentSubtotal += amount;
            }
        });

        globalTaxes.filter(t => t.target === "SubtotalAmount").forEach(tax => {
            const amount = currentSubtotal * (tax.percentage / 100);
            processedTaxes.push({ ...tax, calculatedAmount: amount });
            
            // ✅ FIX: Replaced ternary with strict if/else
            if (tax.impact === "DisplayOnly") {
                totalIncomeTaxToPay += amount;
            } else {
                currentSubtotal += amount;
            }
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

    // --- UI LAYOUT ---
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-32">
            <div className="max-w-5xl mx-auto pt-10 px-6 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 h-10 w-10 p-0 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Step 2: Apply Taxes</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Review base bills and apply global summary taxes.</p>
                    </div>
                </div>

                {/* Extracted Tax Table Component */}
                <GlobalTaxTable 
                    globalTaxes={globalTaxes}
                    availableTaxRules={availableTaxRules}
                    mathResults={mathResults}
                    setGlobalTaxes={setGlobalTaxes}
                    updateGlobalTax={updateGlobalTax}
                />
            </div>

            {/* Bottom Floating Bar */}
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