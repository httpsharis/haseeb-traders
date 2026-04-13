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

    const { bills, mathResults, globalTaxes } = data;
    const finalDisplayName = fetchedClientName || data.clientName || "LOADING CLIENT...";

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

                {/* --- AGGRESSIVE PRINT CSS OVERRIDE --- */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print { 
                        @page { size: landscape; margin: 0mm !important; }
                        
                        body * { visibility: hidden; }
                        #print-wrapper, #print-wrapper * { visibility: visible; }
                        
                        #print-wrapper { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100vw; 
                            height: 100vh;
                            padding: 10mm;
                            margin: 0;
                            border: none !important;
                            box-shadow: none !important;
                            background: white !important;
                            border-radius: 0 !important;
                        }
                        
                        html, body, main { background: white !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                ` }} />

                {/* --- START OF DOCUMENT --- */}
                <div id="print-wrapper" className="bg-[#fcfaf8] w-full text-black font-sans text-[13px] leading-tight shadow-xl rounded-xl border border-slate-300 p-8 print:p-0">
                    
                    {/* PAGE HEADER */}
                    <div className="border-b-2 border-black pb-4 mb-6">
                        <div className="text-center mb-4">
                            <h1 className="text-3xl font-black tracking-widest uppercase text-black">{finalDisplayName}</h1>
                            <h2 className="text-xl font-bold tracking-[0.4em] uppercase text-black mt-2">Summary</h2>
                        </div>
                        
                        {/* Meta Data Row */}
                        <div className="flex justify-end">
                            <div className="flex border-2 border-black text-[12px] font-bold bg-white">
                                <div className="px-4 py-1.5 border-r-2 border-black uppercase tracking-wider">Summary No.</div>
                                <div className="px-6 py-1.5 border-r-2 border-black">4</div>
                                <div className="px-4 py-1.5 border-r-2 border-black uppercase tracking-wider">Dated</div>
                                <div className="px-6 py-1.5">{formattedDate}</div>
                            </div>
                        </div>
                    </div>

                    {/* MAIN TABLE */}
                    <div className="mb-6">
                        <table className="w-full border-collapse text-center border-2 border-black bg-white">
                            <thead className="border-b-2 border-black">
                                <tr className="divide-x-2 divide-black">
                                    <th className="py-3 w-10 text-[11px] font-black uppercase text-black">Sr.</th>
                                    <th className="py-3 w-24 text-[11px] font-black uppercase text-black">Date</th>
                                    <th className="py-3 w-32 text-[11px] font-black uppercase text-black">Invoice No.</th>
                                    <th className="py-3 px-4 text-left text-[11px] font-black uppercase text-black">Description</th>
                                    <th className="py-3 px-2 w-28 text-[11px] font-black uppercase text-black">Base Val</th>
                                    {globalTaxes.map(tax => (
                                        <th key={tax.id} className="py-3 px-2 w-24">
                                            <div className="font-black text-[11px] uppercase text-black leading-tight mb-1">{tax.name}</div>
                                            <div className="text-[10px] font-bold text-black">{tax.percentage}%</div>
                                        </th>
                                    ))}
                                    <th className="py-3 w-32 text-black text-[11px] font-black uppercase">Net Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y border-b-2 border-black divide-black">
                                {bills.map((bill, index) => {
                                    const row = getRowData(bill);
                                    return (
                                        <tr key={bill._id} className="divide-x-2 divide-black print:hover:bg-white hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 px-2 text-black font-medium">{index + 1}</td>
                                            <td className="py-2.5 px-2 text-black font-medium">{bill.date ? new Date(bill.date).toLocaleDateString() : "-"}</td>
                                            <td className="py-2.5 px-2 font-bold text-black">{bill.billNumber || `INV-${bill._id.slice(-4).toUpperCase()}`}</td>
                                            <td className="py-2.5 px-4 text-left font-bold text-black">{bill.category || bill.description}</td>
                                            <td className="py-2.5 px-2 font-bold text-black">{formatAmt(row.baseAmt)}</td>
                                            {globalTaxes.map(tax => (
                                                <td key={tax.id} className="py-2.5 px-2 font-medium text-black">
                                                    {row.rowTaxes[tax.id] > 0 ? formatAmt(row.rowTaxes[tax.id]) : "-"}
                                                </td>
                                            ))}
                                            <td className="py-2.5 px-2 font-black text-black text-[13px]">{formatAmt(row.finalAmt)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="font-black divide-x-2 divide-black">
                                <tr>
                                    <td colSpan={4} className="py-3.5 text-right pr-6 text-[12px] uppercase tracking-widest text-black">Payable Amount</td>
                                    <td className="py-3.5 text-[13px] text-black">{formatAmt(mathResults.combinedBillsTotal)}</td>
                                    {globalTaxes.map(tax => {
                                        const taxTotal = mathResults.processedTaxes.find(t => t.id === tax.id)?.calculatedAmount || 0;
                                        return <td key={tax.id} className="py-3.5 text-[13px] text-black">{taxTotal > 0 ? formatAmt(taxTotal) : "-"}</td>
                                    })}
                                    <td className="py-3.5 text-[15px] font-black text-black">{formatAmt(mathResults.finalNetTotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* FOOTER STATS SECTION */}
                    <div className="flex justify-between items-start gap-8">
                        
                        {/* VERTICAL STATS BOX */}
                        <div className="w-[320px] border-2 border-black divide-y-2 divide-black text-[12px] bg-white">
                            <div className="flex font-bold divide-x-2 divide-black">
                                <div className="flex-1 px-4 py-2 text-center">Net Amount</div>
                                <div className="w-32 text-center px-4 py-2">{formatAmt(mathResults.finalNetTotal)}</div>
                            </div>
                            <div className="flex font-bold divide-x-2 divide-black">
                                <div className="flex-1 px-4 py-2 text-center">Non-Taxable Portion</div>
                                <div className="w-32 text-center px-4 py-2">-</div>
                            </div>
                            <div className="flex font-bold divide-x-2 divide-black">
                                <div className="flex-1 px-4 py-2 text-center">Gross Billing</div>
                                <div className="w-32 text-center px-4 py-2">{formatAmt(mathResults.combinedBillsTotal)}</div>
                            </div>
                            {globalTaxes.map(tax => {
                                const taxTotal = mathResults.processedTaxes.find(t => t.id === tax.id)?.calculatedAmount || 0;
                                return (
                                    <div key={tax.id} className="flex font-bold divide-x-2 divide-black">
                                        <div className="flex-1 px-4 py-2 text-center">{tax.name} ({tax.percentage}%)</div>
                                        <div className="w-32 text-center px-4 py-2">{taxTotal > 0 ? formatAmt(taxTotal) : "-"}</div>
                                    </div>
                                )
                            })}
                            <div className="flex font-black divide-x-2 divide-black">
                                <div className="flex-1 px-4 py-2 text-center">Total Tax</div>
                                <div className="w-32 text-center px-4 py-2">{formatAmt(allTaxesCombinedSum)}</div>
                            </div>
                        </div>

                        {/* MONTH & NOTE BOX */}
                        <div className="w-[280px] border-2 border-black flex flex-col bg-white">
                            <div className="text-center font-black text-xl py-4 border-b-2 border-black uppercase tracking-widest text-black">
                                {monthYear}
                            </div>
                            <div className="p-5 text-center flex-1 flex flex-col justify-center items-center">
                                <h3 className="text-[13px] font-black mb-2 text-black uppercase tracking-widest underline underline-offset-4">Note</h3>
                                <p className="text-[11px] font-bold text-black leading-snug">
                                    For internal record keeping only. Not intended for official tax submission.
                                </p>
                            </div>
                        </div>

                        {/* SIGNATURE */}
                        <div className="flex-1 max-w-[220px] h-[140px] flex flex-col justify-end pb-4 px-4 border-2 border-black relative bg-white">
                            <div className="absolute top-[80px] left-[10%] w-[80%] h-[2px] bg-black"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-black text-center">Authorized Signature</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}