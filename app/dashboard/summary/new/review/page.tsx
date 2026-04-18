"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { SummaryPrintDocument } from "@/components/features/summaries/SummaryPrint";

// --- STRICT TYPES ---
interface BillType {
    _id: string;
    description?: string;
    category?: string;
    baseAmount?: string | number;
    amount?: string | number;
    subTotal?: string | number;
    totalAmount?: string | number;
    quantity?: string | number;
    unitPrice?: string | number;
    price?: string | number;
    date?: string;
    billNumber?: string;
}

interface GlobalAppliedTax {
    id: string;
    name: string;
    percentage: number;
    target: "BaseAmount" | "SubtotalAmount";
    impact: "Add" | "DisplayOnly";
    calculatedAmount?: number;
}

interface MathResults {
    combinedBillsTotal: number;
    processedTaxes: GlobalAppliedTax[];
    standardTaxesTotal: number;
    totalIncomeTaxToPay: number;
    finalNetTotal: number;
}

interface SummaryData {
    clientId: string;
    clientName?: string;
    billIds: string[];
    bills: BillType[];
    globalTaxes: GlobalAppliedTax[];
    mathResults: MathResults;
}

interface ClientRecord {
    _id: string;
    name?: string;
    companyName?: string;
}

export default function ReviewSummaryPage() {
    const router = useRouter();
    const [data, setData] = useState<SummaryData | null>(null);
    const [fetchedClientName, setFetchedClientName] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem("pendingSummary");
        if (!saved) {
            router.push("/dashboard/summary/new");
            return;
        }
        
        const parsedData = JSON.parse(saved) as SummaryData;
        setData(parsedData);

        if (parsedData.clientId) {
            fetch(`/api/clients?t=${Date.now()}`)
                .then(res => res.json())
                .then(clientRes => {
                    let clientsArray: ClientRecord[] = [];
                    
                    if (Array.isArray(clientRes)) {
                        clientsArray = clientRes as ClientRecord[];
                    } else if (Array.isArray(clientRes?.data)) {
                        clientsArray = clientRes.data as ClientRecord[];
                    } else if (Array.isArray(clientRes?.docs)) {
                        clientsArray = clientRes.docs as ClientRecord[];
                    }

                    const foundClient = clientsArray.find((c: ClientRecord) => c._id === parsedData.clientId);
                    if (foundClient) {
                        setFetchedClientName(foundClient.name || foundClient.companyName || "");
                    }
                })
                .catch(err => console.error("Failed to fetch client name", err));
        }
    }, [router]);

    const handleFinalize = async () => {
        if (!data) return;
        setIsSaving(true);
        try {
            const dateObj = new Date();
            const currentTaxPeriod = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const shortId = Math.floor(10000 + Math.random() * 90000);

            const formattedTaxesForDB = data.globalTaxes.map(tax => {
                const processed = data.mathResults.processedTaxes.find(t => t.id === tax.id);
                return {
                    name: tax.name,
                    percentage: tax.percentage,
                    target: tax.target,
                    impact: tax.impact,
                    amount: processed ? processed.calculatedAmount : 0 
                };
            });

            const summaryPayload = {
                client: data.clientId,
                summaryNumber: `SUM-${shortId}`, 
                date: dateObj.toISOString(),
                bills: data.billIds,
                summarySubTotal: data.mathResults.combinedBillsTotal,
                totalTaxAmount: data.mathResults.standardTaxesTotal,
                netPayable: data.mathResults.finalNetTotal,
                summaryTaxes: formattedTaxesForDB, 
                taxPeriod: currentTaxPeriod
            };

            const res = await fetch("/api/summaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(summaryPayload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMsg = errorData.error || errorData.message || res.statusText;
                alert(`Database Error: ${errorMsg}`);
                throw new Error(errorMsg);
            }

            sessionStorage.removeItem("pendingSummary");
            window.print();
            setTimeout(() => router.push("/dashboard/summary"), 500);
            
        } catch (error) {
            console.error("Failed to save summary:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!data) return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" /></div>;

    const { bills, mathResults, globalTaxes } = data;
    const finalDisplayName = fetchedClientName || data.clientName || "LOADING CLIENT...";

    const today = new Date();
    const monthYear = today.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
    const formattedDate = `${today.getDate()}/${today.toLocaleDateString("en-US", { month: "short" })}/${today.toLocaleDateString("en-US", { year: "2-digit" })}`;
    const allTaxesCombinedSum = mathResults.processedTaxes.reduce((sum, t) => sum + (t.calculatedAmount || 0), 0);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-32 print:bg-white print:pb-0 print:min-h-0">
            <div className="max-w-[1100px] mx-auto pt-8 px-4 space-y-6 print:p-0 print:m-0 print:space-y-0 print:max-w-none print:w-full">
                
                {/* ACTIONS - HIDDEN ON PRINT */}
                <div className="flex items-center justify-between print:hidden mb-8">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Adjust Taxes
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => window.print()} className="font-bold bg-white">
                            <Printer className="w-4 h-4 mr-2" /> Print Ledger
                        </Button>
                        <Button onClick={handleFinalize} disabled={isSaving} className="bg-[#ea580c] text-white hover:bg-[#d44d0a] font-bold px-8">
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save & Finalize"}
                        </Button>
                    </div>
                </div>

                {/* THE EXTRACTED VISUAL COMPONENT */}
                <SummaryPrintDocument 
                    finalDisplayName={finalDisplayName}
                    formattedDate={formattedDate}
                    monthYear={monthYear}
                    bills={bills}
                    globalTaxes={globalTaxes}
                    mathResults={mathResults}
                    allTaxesCombinedSum={allTaxesCombinedSum}
                />
            </div>
        </div>
    );
}