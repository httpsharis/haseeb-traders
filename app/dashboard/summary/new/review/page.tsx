"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer } from "lucide-react";

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
    calculatedAmount: number;
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

export default function ReviewSummaryPage() {
    const router = useRouter();
    const [data, setData] = useState<SummaryData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem("pendingSummary");
        if (!saved) {
            router.push("/dashboard/summary/new");
            return;
        }
        setData(JSON.parse(saved) as SummaryData);
    }, [router]);

    const handleFinalize = async () => {
        if (!data) return;
        setIsSaving(true);
        try {
            const summaryPayload = {
                client: data.clientId,
                summaryNumber: "SUM-" + Date.now(),
                date: new Date().toISOString(),
                bills: data.billIds,
                summarySubTotal: data.mathResults.combinedBillsTotal,
                totalTaxAmount: data.mathResults.standardTaxesTotal,
                netPayable: data.mathResults.finalNetTotal,
                summaryTaxes: data.globalTaxes, 
                status: "Finalized",
            };

            const res = await fetch("/api/summaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(summaryPayload),
            });

            if (res.ok) {
                sessionStorage.removeItem("pendingSummary");
                window.print();
                setTimeout(() => router.push("/dashboard/summary"), 500);
            }
        } catch (error) {
            console.error("Failed to save summary:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!data) return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" /></div>;

    const { bills, mathResults, globalTaxes, clientName } = data;

    const formatAmt = (num: number) => num.toLocaleString("en-PK", { maximumFractionDigits: 0 });
    const getBaseAmount = (bill: BillType): number => {
        const directTotals = [bill.baseAmount, bill.amount, bill.subTotal, bill.totalAmount];
        for (const t of directTotals) {
            const val = Number(t?.toString().replace(/,/g, ""));
            if (val > 0) return val;
        }
        return (Number(bill.quantity) || 1) * Number(bill.unitPrice || bill.price) || 0;
    };

    const getRowData = (bill: BillType) => {
        const baseAmt = getBaseAmount(bill);
        let currentSub = baseAmt;
        const rowTaxes: Record<string, number> = {};
        globalTaxes.filter(t => t.target === "BaseAmount").forEach(tax => {
            const amt = baseAmt * (tax.percentage / 100);
            rowTaxes[tax.id] = amt;
            if (tax.impact === "Add") currentSub += amt;
        });
        globalTaxes.filter(t => t.target === "SubtotalAmount").forEach(tax => {
            const amt = currentSub * (tax.percentage / 100);
            rowTaxes[tax.id] = amt;
            if (tax.impact === "Add") currentSub += amt;
        });
        return { baseAmt, rowTaxes, finalAmt: currentSub };
    };

    const today = new Date();
    const monthYear = today.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
    const formattedDate = `${today.getDate()}/${today.toLocaleDateString("en-US", { month: "short" })}/${today.toLocaleDateString("en-US", { year: "2-digit" })}`;
    const allTaxesCombinedSum = mathResults.processedTaxes.reduce((sum, t) => sum + t.calculatedAmount, 0);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-32 print:bg-transparent print:pb-0">
            <div className="max-w-[1050px] mx-auto pt-8 px-4 space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full">
                
                {/* ACTIONS - HIDDEN ON PRINT */}
                <div className="flex items-center justify-between print:hidden mb-8">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Adjust Taxes
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => window.print()} className="font-bold bg-white">
                            <Printer className="w-4 h-4 mr-2" /> Print Landscape
                        </Button>
                        <Button onClick={handleFinalize} disabled={isSaving} className="bg-[#ea580c] text-white hover:bg-[#d44d0a] font-bold px-8">
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save & Finalize"}
                        </Button>
                    </div>
                </div>

                {/* --- AGGRESSIVE PRINT CSS OVERRIDE --- */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print { 
                        @page { size: landscape; margin: 10mm; }
                        /* Hide everything on the page by default */
                        body * { visibility: hidden; }
                        
                        /* Make ONLY the print wrapper and its children visible */
                        #print-wrapper, #print-wrapper * { visibility: visible; }
                        
                        /* Rip the wrapper out of the layout and put it at the top left */
                        #print-wrapper { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            margin: 0;
                            padding: 0;
                            border: none !important;
                            box-shadow: none !important;
                        }
                        
                        /* Nuke the background colors of the app layout */
                        html, body, main { background: white !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                ` }} />

                {/* --- START OF LANDSCAPE PRINTABLE DOCUMENT --- */}
                <div id="print-wrapper" className="bg-white w-full text-slate-900 font-sans text-[13px] leading-tight shadow-sm rounded-xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none">
                    
                    {/* PAGE HEADER */}
                    <div className="relative p-8 pb-4 border-b border-slate-100 print:border-slate-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{clientName || "Haseeb Traders"}</h1>
                                <p className="text-slate-500 font-bold tracking-widest text-[11px] mt-1 print:text-slate-800">BILLING MANAGEMENT SYSTEM</p>
                            </div>
                            <div className="text-right">
                                <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded text-[14px] font-black tracking-widest print:border print:border-black">
                                    SUMMARY NO. 4
                                </div>
                                <p className="mt-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest print:text-slate-600">Dated: {formattedDate}</p>
                            </div>
                        </div>
                        <div className="mt-6 text-center border-y border-slate-900 py-2 print:border-black">
                            <h2 className="text-xl font-black tracking-[0.3em] uppercase text-slate-800 print:text-black">Summary Invoice Ledger</h2>
                        </div>
                    </div>

                    {/* MAIN TABLE */}
                    <div className="px-8 py-4">
                        <div className="border border-slate-300 print:border-slate-800 rounded-lg print:rounded-none overflow-hidden">
                            <table className="w-full border-collapse text-center">
                                <thead className="bg-slate-100 print:bg-slate-200 border-b border-slate-300 print:border-slate-800">
                                    <tr className="divide-x divide-slate-300 print:divide-slate-800">
                                        <th className="py-2.5 w-10 text-[10px] font-black uppercase text-slate-500 print:text-slate-800">Sr.</th>
                                        <th className="py-2.5 w-20 text-[10px] font-black uppercase text-slate-500 print:text-slate-800">Date</th>
                                        <th className="py-2.5 w-32 text-[10px] font-black uppercase text-slate-500 print:text-slate-800">Invoice No.</th>
                                        <th className="py-2.5 px-4 text-left text-[10px] font-black uppercase text-slate-500 print:text-slate-800">Description</th>
                                        <th className="py-2.5 px-2 w-28 text-[10px] font-black uppercase text-slate-500 print:text-slate-800">Base Val</th>
                                        {globalTaxes.map(tax => (
                                            <th key={tax.id} className="py-2.5 px-2 w-24 bg-orange-50/50 print:bg-transparent">
                                                <div className="font-black text-[10px] uppercase text-[#ea580c] print:text-slate-800">{tax.name}</div>
                                                <div className="text-[9px] font-bold text-orange-400/70 print:text-slate-600">{tax.percentage}%</div>
                                            </th>
                                        ))}
                                        <th className="py-2.5 w-32 bg-slate-900 print:bg-slate-300 text-white print:text-slate-900 text-[10px] font-black uppercase">Net Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 print:divide-slate-400">
                                    {bills.map((bill, index) => {
                                        const row = getRowData(bill);
                                        return (
                                            <tr key={bill._id} className="divide-x divide-slate-200 print:divide-slate-400 hover:bg-slate-50 transition-colors print:hover:bg-white">
                                                <td className="py-2.5 px-2 text-slate-500 print:text-slate-800 font-medium">{index + 1}</td>
                                                <td className="py-2.5 px-2 text-slate-600 print:text-slate-800">{bill.date ? new Date(bill.date).toLocaleDateString() : "-"}</td>
                                                <td className="py-2.5 px-2 font-bold text-slate-900">{bill.billNumber || `INV-${bill._id.slice(-4).toUpperCase()}`}</td>
                                                <td className="py-2.5 px-4 text-left font-bold text-slate-800 print:text-slate-900">{bill.category || bill.description}</td>
                                                <td className="py-2.5 px-2 font-bold text-slate-600 print:text-slate-800">{formatAmt(row.baseAmt)}</td>
                                                {globalTaxes.map(tax => (
                                                    <td key={tax.id} className="py-2.5 px-2 font-medium text-slate-600 print:text-slate-800 bg-orange-50/20 print:bg-transparent">
                                                        {row.rowTaxes[tax.id] > 0 ? formatAmt(row.rowTaxes[tax.id]) : "-"}
                                                    </td>
                                                ))}
                                                <td className="py-2.5 px-2 font-black text-slate-900 text-[13px]">{formatAmt(row.finalAmt)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-50 print:bg-slate-100 font-black divide-x divide-slate-300 print:divide-slate-800 border-t-2 border-slate-900 print:border-black">
                                    <tr>
                                        <td colSpan={4} className="py-3 text-right pr-6 text-[11px] uppercase tracking-[0.2em] text-slate-500 print:text-slate-800">Total Payable Amount</td>
                                        <td className="py-3 text-[13px] text-slate-700 print:text-slate-900">{formatAmt(mathResults.combinedBillsTotal)}</td>
                                        {globalTaxes.map(tax => {
                                            const taxTotal = mathResults.processedTaxes.find(t => t.id === tax.id)?.calculatedAmount || 0;
                                            return <td key={tax.id} className="py-3 text-[13px] text-[#ea580c] print:text-slate-900">{taxTotal > 0 ? formatAmt(taxTotal) : "-"}</td>
                                        })}
                                        <td className="py-3 text-[16px] font-black bg-slate-900 print:bg-slate-300 text-white print:text-slate-900 italic">{formatAmt(mathResults.finalNetTotal)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* FOOTER STATS SECTION */}
                    <div className="px-8 pb-8 mt-2">
                        <div className="flex justify-between items-start gap-8">
                            
                            {/* VERTICAL STATS */}
                            <div className="flex-1 max-w-[400px] space-y-px rounded-lg print:rounded-none overflow-hidden border border-slate-300 print:border-slate-800">
                                <div className="flex bg-slate-900 print:bg-slate-200 print:border-b print:border-slate-800 text-white print:text-slate-900 font-black">
                                    <div className="flex-1 px-4 py-2 text-[11px] uppercase tracking-widest">Final Net Amount</div>
                                    <div className="w-32 text-right px-4 py-2 text-[14px] italic">{formatAmt(mathResults.finalNetTotal)}</div>
                                </div>
                                <div className="flex bg-slate-50 print:bg-white font-bold text-slate-400 print:text-slate-800 print:border-b print:border-slate-800">
                                    <div className="flex-1 px-4 py-1.5 text-[10px] uppercase tracking-widest">Non-Taxable Portion</div>
                                    <div className="w-32 text-right px-4 py-1.5">-</div>
                                </div>
                                <div className="flex bg-white font-bold text-slate-700 print:text-slate-900 print:border-b print:border-slate-800">
                                    <div className="flex-1 px-4 py-1.5 text-[10px] uppercase tracking-widest">Gross Billing Base</div>
                                    <div className="w-32 text-right px-4 py-1.5">{formatAmt(mathResults.combinedBillsTotal)}</div>
                                </div>
                                {globalTaxes.map(tax => {
                                    const taxTotal = mathResults.processedTaxes.find(t => t.id === tax.id)?.calculatedAmount || 0;
                                    return (
                                        <div key={tax.id} className="flex bg-white font-bold text-slate-600 print:text-slate-900 border-t border-slate-100 print:border-b print:border-slate-800">
                                            <div className="flex-1 px-4 py-1.5 text-[10px] uppercase tracking-widest">{tax.name} ({tax.percentage}%)</div>
                                            <div className="w-32 text-right px-4 py-1.5">{taxTotal > 0 ? formatAmt(taxTotal) : "-"}</div>
                                        </div>
                                    )
                                })}
                                <div className="flex bg-slate-100 print:bg-slate-200 font-black text-slate-900 print:text-slate-900 border-t border-slate-300 print:border-slate-800">
                                    <div className="flex-1 px-4 py-2 text-[11px] uppercase tracking-widest">Total Taxes Applied</div>
                                    <div className="w-32 text-right px-4 py-2 text-[#ea580c] print:text-slate-900">{formatAmt(allTaxesCombinedSum)}</div>
                                </div>
                            </div>

                            {/* MONTH & NOTE BOX */}
                            <div className="w-[300px] border-2 border-slate-900 print:border-slate-800 rounded-xl print:rounded-none p-5 text-center relative overflow-hidden bg-slate-50/50 print:bg-transparent">
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 print:hidden"></div>
                                <h3 className="text-xl font-black text-slate-900 tracking-widest uppercase mb-3">{monthYear}</h3>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-[#ea580c] print:text-slate-800 tracking-widest underline underline-offset-2">Internal Note</p>
                                    <p className="text-[11px] font-bold text-slate-500 print:text-slate-800 leading-tight">This ledger summary is for internal verification and account balancing only.</p>
                                </div>
                            </div>

                            {/* SIGNATURE */}
                            <div className="flex-1 max-w-[200px] pt-20 text-center">
                                <div className="w-full h-px bg-slate-900 mx-auto mb-2 print:bg-black"></div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 print:text-black">Authorized Signature</p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}