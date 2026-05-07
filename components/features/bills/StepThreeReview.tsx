"use client";

import { Button } from "@/components/ui/button";
import { LineItem, useBillDraft } from "@/hooks/useBillDraft";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, FileText, LayoutTemplate, Loader2, Printer, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ============================================================================
// SHARED UTILITIES
// ============================================================================
function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Step3Review() {
    const router = useRouter();
    const { data } = useBillDraft();

    // Local states for Print customization
    const [docType, setDocType] = useState<"BILL" | "INVOICE">("INVOICE");
    const [printFormat, setPrintFormat] = useState<"PLAIN" | "LETTERHEAD">("PLAIN");

    // Auto-redirect to step 1 if there's no draft data
    useEffect(() => {
        if (!data || !data.clientName) {
            router.replace("/dashboard/bills/new");
        }
    }, [data, router]);

    if (!data || !data.clientName) return null;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
                onClick={() => router.back()}
                className="flex items-center text-stone-500 hover:text-stone-900 font-bold text-sm mb-6 transition-colors print:hidden"
            >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Edit Items
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: The Smart A4 Document Preview */}
                <div className="lg:col-span-8 print:col-span-12">
                    <PrintLayout docType={docType} printFormat={printFormat} />
                </div>

                {/* Right: The Action Sidebar */}
                <div className="lg:col-span-4 print:hidden">
                    <ReviewSidebar 
                        docType={docType} setDocType={setDocType}
                        printFormat={printFormat} setPrintFormat={setPrintFormat}
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENT 1: PrintLayout
// Now accepts props to change wording and layout for Letterheads!
// ============================================================================
interface PrintLayoutProps {
    docType: "BILL" | "INVOICE";
    printFormat: "PLAIN" | "LETTERHEAD";
}

function PrintLayout({ docType, printFormat }: PrintLayoutProps) {
    const { data } = useBillDraft();

    // ✅ DYNAMIC MATH: Calculate Subtotal directly from items
    const computedSubtotal = data.items.reduce((sum: number, item: LineItem) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
    const gstAmount = data.taxAmount || 0;
    const grandTotal = computedSubtotal + gstAmount;

    // If Letterhead, add massive top padding for the physical printer and hide digital header
    const isLetterhead = printFormat === "LETTERHEAD";

    return (
        <div className={`bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0`}>
            
            {/* Digital Context Bar (Always hidden on physical print) */}
            <div className="bg-stone-50 border-b border-stone-100 px-6 py-3 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{docType} Preview</span>
                <span className="text-xs font-medium text-stone-500">{printFormat} FORMAT</span>
            </div>

            {/* --- AGGRESSIVE PRINT CSS OVERRIDE --- */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print { 
                    @page { size: portrait; margin: 0mm !important; }
                    body * { visibility: hidden; }
                    #print-wrapper, #print-wrapper * { visibility: visible; }
                    #print-wrapper { 
                        position: absolute; left: 0; top: 0; width: 100vw; height: 100vh;
                        padding: 10mm; padding-top: ${isLetterhead ? '50mm' : '25mm'}; margin: 0; border: none !important;
                        box-shadow: none !important; background: white !important; border-radius: 0 !important;
                    }
                    html, body, main { background: white !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            ` }} />

            {/* The Actual Paper Document */}
            <div id="print-wrapper" className="p-8 sm:p-12 bg-white text-black font-sans text-[13px] leading-tight">
                
                {/* HEADER: Hidden if printing on a physical letterhead pad */}
                <div className={`border-b-2 border-black pb-4 mb-6 ${isLetterhead ? 'print:hidden' : ''}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-black tracking-tight">Haseeb Traders</h2>
                            <p className="mt-1 text-sm text-black font-medium leading-relaxed">
                                Main Business Market<br />
                                Multan, Pakistan
                            </p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-4xl font-black tracking-widest text-black uppercase">{docType}</h1>
                            <div className="mt-4 flex border-2 border-black text-[12px] font-bold bg-white inline-flex">
                                <div className="px-3 py-1.5 border-r-2 border-black uppercase tracking-wider">{docType === "INVOICE" ? "Invoice No." : "Bill No."}</div>
                                <div className="px-3 py-1.5 border-r-2 border-black">{data.summaryNumber || "PENDING"}</div>
                                <div className="px-3 py-1.5 border-r-2 border-black uppercase tracking-wider">Dated</div>
                                <div className="px-3 py-1.5">{data.date}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* If Letterhead, we still need to show the Bill No and Date since the header is hidden */}
                {isLetterhead && (
                    <div className="hidden print:flex justify-between items-end mb-6 border-b-2 border-black pb-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-widest text-black uppercase">{docType}</h1>
                        </div>
                        <div className="mt-4 flex border-2 border-black text-[12px] font-bold bg-white inline-flex">
                            <div className="px-3 py-1.5 border-r-2 border-black uppercase tracking-wider">{docType === "INVOICE" ? "Invoice No." : "Bill No."}</div>
                            <div className="px-3 py-1.5 border-r-2 border-black">{data.summaryNumber || "PENDING"}</div>
                            <div className="px-3 py-1.5 border-r-2 border-black uppercase tracking-wider">Dated</div>
                            <div className="px-3 py-1.5">{data.date}</div>
                        </div>
                    </div>
                )}

                <div className="mb-6 text-sm">
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-black border-b border-black pb-2 inline-block">Billed To</h3>
                    <p className="font-black text-xl text-black">{data.clientName}</p>
                </div>

                {/* THE TABLE */}
                <div className="mb-6">
                    <table className="w-full border-collapse text-center border-2 border-black bg-white">
                        <thead className="border-b-2 border-black">
                            <tr className="divide-x-2 divide-black">
                                <th className="py-3 w-12 text-[11px] font-black uppercase text-black">Sr</th>
                                <th className="py-3 px-4 text-left text-[11px] font-black uppercase text-black">Description</th>
                                <th className="py-3 w-24 text-[11px] font-black uppercase text-black">Qty</th>
                                <th className="py-3 w-32 text-[11px] font-black uppercase text-black">Unit Price</th>
                                <th className="py-3 w-32 text-[11px] font-black uppercase text-black">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y border-b-2 border-black divide-black">
                            {data.items.map((item: LineItem, idx: number) => (
                                <tr key={idx} className="divide-x-2 divide-black print:hover:bg-white hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-2 text-black font-medium">{String(idx + 1).padStart(2, '0')}</td>
                                    <td className="py-3 px-4 text-left">
                                        <p className="font-bold text-black">{item.description}</p>
                                        <p className="text-[10px] text-black font-bold uppercase tracking-widest mt-1">{item.category}</p>
                                    </td>
                                    <td className="py-3 px-2 font-bold text-black">{item.quantity}</td>
                                    <td className="py-3 px-2 font-bold text-black">{formatMoney(item.unitPrice)}</td>
                                    <td className="py-3 px-2 font-black text-black">{formatMoney(item.quantity * item.unitPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="font-black divide-x-2 divide-black border-t-2 border-black bg-stone-50">
                            <tr>
                                <td colSpan={4} className="py-3 text-right pr-4 text-[12px] uppercase tracking-widest text-black">Subtotal</td>
                                <td className="py-3 text-[13px] text-black">{formatMoney(computedSubtotal)}</td>
                            </tr>
                            {gstAmount > 0 && (
                                <tr className="border-t-2 border-black">
                                    <td colSpan={4} className="py-3 text-right pr-4 text-[12px] uppercase tracking-widest text-black">Total GST</td>
                                    <td className="py-3 text-[13px] text-black">{formatMoney(gstAmount)}</td>
                                </tr>
                            )}
                            <tr className="border-t-2 border-black bg-white">
                                <td colSpan={4} className="py-3 text-right pr-4 text-[12px] uppercase tracking-widest text-black">Total Payment</td>
                                <td className="py-3 text-[15px] font-black text-black">Rs {formatMoney(grandTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* FOOTER */}
                <div className="mt-12 pt-4 border-t-2 border-black flex justify-between items-end">
                    <p className="text-[10px] font-bold tracking-widest text-black uppercase">
                        System Generated {docType} - Haseeb Traders
                    </p>
                    <div className="text-right">
                        <p className="font-bold text-black text-[10px] uppercase tracking-widest">Authorized Signature</p>
                        <div className="w-48 border-b-2 border-black mt-12 mb-1"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENT 2: ReviewSidebar
// ============================================================================
interface SidebarProps {
    docType: "BILL" | "INVOICE";
    setDocType: (v: "BILL" | "INVOICE") => void;
    printFormat: "PLAIN" | "LETTERHEAD";
    setPrintFormat: (v: "PLAIN" | "LETTERHEAD") => void;
}

function ReviewSidebar({ docType, setDocType, printFormat, setPrintFormat }: SidebarProps) {
    const router = useRouter();
    const { data, resetDraft } = useBillDraft();
    
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleFinalize = async () => {
        setIsSaving(true);
        setError("");

        try {
            // ✅ DYNAMIC MATH: Calculate totals securely before saving to DB
            const computedSubtotal = data.items.reduce((sum: number, item: LineItem) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
            const gstAmount = data.taxAmount || 0;
            const grandTotal = computedSubtotal + gstAmount;

            const masterBillPayload = {
                client: data.clientId,
                billNumber: data.summaryNumber || `INV-${Date.now().toString().slice(-6)}`,
                date: data.date || new Date().toISOString(),
                description: data.items.length === 1 ? data.items[0].description : "Combined Invoice",
                category: data.items.length > 0 ? data.items[0].category : "General", 
                items: data.items,
                // Include the computed totals!
                baseAmount: computedSubtotal,
                taxAmount: gstAmount,
                amount: grandTotal,
                documentType: docType,
                status: "Unbilled"
            };

            const url = data._id ? `/api/bills/${data._id}` : "/api/bills";
            const method = data._id ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method, // Uses the dynamic method
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(masterBillPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save bill");
            }

            // Success handling
            setIsSuccess(true);
            setTimeout(() => {
                resetDraft();
                localStorage.removeItem("haseeb_bill_draft");
                router.push("/dashboard");
            }, 1000);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to connect to database");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 print:hidden sticky top-6">
            
            {/* Toggles Card */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-5">
                <h3 className="font-black tracking-tight text-sm text-stone-900 uppercase">Document Settings</h3>
                
                <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Document Type</label>
                    <div className="grid grid-cols-2 gap-2 bg-stone-50 p-1 rounded-lg border border-stone-100">
                        <button 
                            onClick={() => setDocType("INVOICE")}
                            className={`py-2 text-xs font-bold rounded-md transition-all ${docType === "INVOICE" ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                            <FileText className="h-3 w-3 inline-block mr-1.5 mb-0.5" /> Invoice
                        </button>
                        <button 
                            onClick={() => setDocType("BILL")}
                            className={`py-2 text-xs font-bold rounded-md transition-all ${docType === "BILL" ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                            <ReceiptText className="h-3 w-3 inline-block mr-1.5 mb-0.5" /> Bill
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Paper Layout</label>
                    <div className="grid grid-cols-2 gap-2 bg-stone-50 p-1 rounded-lg border border-stone-100">
                        <button 
                            onClick={() => setPrintFormat("PLAIN")}
                            className={`py-2 text-xs font-bold rounded-md transition-all ${printFormat === "PLAIN" ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                            <FileText className="h-3 w-3 inline-block mr-1.5 mb-0.5" /> Plain A4
                        </button>
                        <button 
                            onClick={() => setPrintFormat("LETTERHEAD")}
                            className={`py-2 text-xs font-bold rounded-md transition-all ${printFormat === "LETTERHEAD" ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                            <LayoutTemplate className="h-3 w-3 inline-block mr-1.5 mb-0.5" /> Letterpad
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-xl shadow-xl shadow-stone-200/40 border border-stone-200 p-6 space-y-4">
                <h3 className="font-black tracking-tight text-lg text-stone-900 mb-2">Final Actions</h3>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <Button
                    onClick={handleFinalize}
                    disabled={isSaving || isSuccess}
                    className={`w-full h-12 font-bold shadow-md transition-all duration-300 rounded-xl text-white 
                        ${isSuccess ? "bg-emerald-500 shadow-emerald-500/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"}`}
                >
                    {isSuccess ? <><CheckCircle2 className="mr-2 h-5 w-5" /> Saved!</> : isSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : <><CheckCircle2 className="mr-2 h-5 w-5" /> Save to Database</>}
                </Button>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" onClick={() => window.print()} className="h-11 font-bold text-stone-600 rounded-xl shadow-none hover:bg-stone-50">
                        <Printer className="mr-2 h-4 w-4 text-stone-400" /> Print
                    </Button>
                    <Button variant="outline" className="h-11 font-bold text-stone-600 rounded-xl shadow-none hover:bg-stone-50">
                        <Download className="mr-2 h-4 w-4 text-stone-400" /> PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}