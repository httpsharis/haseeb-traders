"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Printer, Download, Loader2, AlertCircle, ArrowLeft, FileText, LayoutTemplate, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBillDraft, LineItem, TaxCharge } from "@/hooks/useBillDraft";

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

    const baseAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const gstAmount = data.items.reduce((sum, item) => {
        const itemGst = item.taxes?.find(t => t.name === "GST");
        return sum + (itemGst ? itemGst.amount : 0);
    }, 0);
    const grandTotal = baseAmount + gstAmount;

    // If Letterhead, add massive top padding for the physical printer and hide digital header
    const isLetterhead = printFormat === "LETTERHEAD";

    return (
        <div className={`bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0 ${isLetterhead ? 'print:pt-48' : ''}`}>
            
            {/* Digital Context Bar (Always hidden on physical print) */}
            <div className="bg-stone-50 border-b border-stone-100 px-6 py-3 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{docType} Preview</span>
                <span className="text-xs font-medium text-stone-500">{printFormat} FORMAT</span>
            </div>

            {/* The Actual Paper Document */}
            <div className="p-8 sm:p-12 bg-white">
                
                {/* HEADER: Hidden if printing on a physical letterhead pad */}
                <div className={`flex justify-between items-start mb-16 ${isLetterhead ? 'print:hidden' : ''}`}>
                    <div>
                        <h2 className="text-2xl font-black text-stone-900 tracking-tight">Haseeb Traders</h2>
                        <p className="mt-1 text-sm text-stone-500 font-medium leading-relaxed">
                            Main Business Market<br />
                            Multan, Pakistan
                        </p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-black tracking-widest text-stone-200 uppercase">{docType}</h1>
                        <p className="mt-4 text-sm font-bold text-stone-900">
                            {docType === "INVOICE" ? "Invoice No." : "Bill No."} {data.summaryNumber}
                        </p>
                        <p className="text-sm text-stone-500 font-medium">Date: {data.date}</p>
                    </div>
                </div>

                {/* If Letterhead, we still need to show the Bill No and Date since the header is hidden */}
                {isLetterhead && (
                    <div className="hidden print:flex justify-between items-end mb-12 border-b border-stone-200 pb-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-widest text-stone-900 uppercase">{docType}</h1>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-bold text-stone-900">{docType === "INVOICE" ? "Invoice No." : "Bill No."} {data.summaryNumber}</p>
                            <p className="text-stone-500 font-medium">Date: {data.date}</p>
                        </div>
                    </div>
                )}

                <div className="mb-12">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 border-b border-stone-100 pb-2 inline-block">Billed To</p>
                    <p className="text-lg font-black text-stone-900">{data.clientName}</p>
                </div>

                {/* THE TABLE */}
                <table className="w-full text-sm mb-12 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-stone-900 text-left">
                            <th className="py-3 font-bold uppercase tracking-widest text-stone-900 text-[10px] text-left">Description</th>
                            <th className="py-3 text-right font-bold uppercase tracking-widest text-stone-900 text-[10px] w-24">Qty</th>
                            <th className="py-3 text-right font-bold uppercase tracking-widest text-stone-900 text-[10px] w-32">Unit Price</th>
                            <th className="py-3 text-right font-bold uppercase tracking-widest text-stone-900 text-[10px] w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {data.items.map((item: LineItem, idx: number) => (
                            <tr key={idx} className="even:bg-stone-50/50">
                                <td className="py-4">
                                    <p className="font-bold text-stone-900">{item.description}</p>
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">{item.category}</p>
                                </td>
                                <td className="py-4 text-right text-stone-700 font-medium">{item.quantity}</td>
                                <td className="py-4 text-right text-stone-700 font-medium">{formatMoney(item.unitPrice)}</td>
                                <td className="py-4 text-right font-black text-stone-900">{formatMoney(item.quantity * item.unitPrice)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* TOTALS */}
                <div className="flex justify-end mb-16">
                    <div className="w-72 space-y-4 text-sm">
                        <div className="flex justify-between items-center text-stone-600">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-black text-stone-900">{formatMoney(baseAmount)}</span>
                        </div>
                        {gstAmount > 0 && (
                            <div className="flex justify-between items-center text-stone-600">
                                <span className="font-medium">GST</span>
                                <span className="font-black text-stone-900">{formatMoney(gstAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center border-t-2 border-stone-900 pt-4 text-lg font-black text-stone-900">
                            <span className="uppercase text-[10px] tracking-widest text-stone-500">Total Payment</span>
                            <span>Rs {formatMoney(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="pt-8 border-t border-stone-200 text-center flex justify-between items-end">
                    <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                        System Generated {docType} - Haseeb Traders
                    </p>
                    <div className="text-right">
                        <p className="font-bold text-stone-500 text-[10px] uppercase tracking-widest">Authorized Signature</p>
                        <div className="w-48 border-b-2 border-stone-800 mt-12 mb-1"></div>
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
            let masterBaseAmount = 0;
            let masterTaxAmount = 0;

            const formattedItems = data.items.map((item: LineItem) => {
                const q = Number(item.quantity) || 1;
                const p = Number(item.unitPrice) || 0;
                const itemBase = q * p;

                const itemTax = Array.isArray(item.taxes)
                    ? item.taxes.reduce((sum: number, t: TaxCharge) => sum + (Number(t.amount) || 0), 0)
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

            const masterBillPayload = {
                client: data.clientId,
                billNumber: data.summaryNumber || `INV-${Date.now().toString().slice(-6)}`,
                date: data.date || new Date().toISOString(),
                description: data.items.length === 1 ? data.items[0].description : "Combined Invoice",
                category: data.items.length > 0 ? data.items[0].category : "General", 
                quantity: 1,
                unitPrice: masterBaseAmount,
                baseAmount: masterBaseAmount,
                taxAmount: masterTaxAmount,
                amount: masterBaseAmount + masterTaxAmount,
                items: formattedItems,
                documentType: docType,
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