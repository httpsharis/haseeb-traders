"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, ArrowRight, Printer, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { useBillDraft, LineItem } from "@/hooks/useBillDraft";
import { useRouter } from "next/navigation";

// ============================================================================
// TYPES & UTILITIES
// ============================================================================

// Local interface for fetched categories
interface Category {
    _id: string;
    name: string;
    isActive?: boolean;
}

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Step2Items() {
    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 print:m-0 print:max-w-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
                <div className="lg:col-span-8 space-y-6">
                    <LineItemsTable />
                </div>
                <div className="lg:col-span-4">
                    <LiveDraftSidebar />
                </div>
            </div>
            <div className="hidden print:block print:w-full">
                <PrintLayout />
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENT 1: LineItemsTable
// ============================================================================
function LineItemsTable() {
    // ✅ IMPROVEMENT: Using useBillDraft instead of useWizard
    const { data, addItem, updateItem, removeItem } = useBillDraft();
    const [categories, setCategories] = useState<Category[]>([]);

    const [globalCategory, setGlobalCategory] = useState(() => {
        return data.items && data.items.length > 0 ? data.items[0].category : "";
    });

    useEffect(() => {
        fetch("/api/categories")
            .then((res) => res.json())
            .then((cats) => {
                const catArray = Array.isArray(cats) ? cats : cats.data || [];
                const activeCats = catArray.filter((c: Category) => c.isActive !== false);
                setCategories(activeCats);

                if (activeCats.length > 0) {
                    setGlobalCategory((prev) => prev || activeCats[0].name);
                }
            });
    }, []);

    const handleAddEmptyRow = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!globalCategory) return;

        const newItem: LineItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            billNumber: String(data.items.length + 1),
            date: data.date,
            description: "",
            category: globalCategory,
            quantity: 1,
            unitPrice: 0,
            taxes: [],
        };
        addItem(newItem);
    };

    const updateField = <K extends keyof LineItem>(id: string, field: K, value: LineItem[K]) => {
        updateItem(id, { [field]: value });
    };

    const updateGST = (id: string, item: LineItem, gstPercent: number) => {
        if (gstPercent <= 0) {
            updateItem(id, { taxes: [] });
            return;
        }
        const baseAmount = item.quantity * item.unitPrice;
        updateItem(id, {
            taxes: [
                {
                    name: "GST",
                    percentage: gstPercent,
                    baseAmount: baseAmount,
                    amount: (baseAmount * gstPercent) / 100,
                },
            ],
        });
    };

    const inputClasses =
        "w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white rounded-md px-2 py-1.5 text-sm text-stone-900 font-medium outline-none transition-all placeholder:text-stone-300";

    return (
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type="number"] { -moz-appearance: textfield; }` }} />

            <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-sm font-bold text-stone-800 uppercase tracking-widest">Line Items</h2>
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider hidden sm:block">Category:</label>
                    <div className="relative group w-full sm:w-64">
                        <select
                            value={globalCategory}
                            onChange={(e) => setGlobalCategory(e.target.value)}
                            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 pr-10 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer text-stone-800"
                        >
                            <option value="">Select category...</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="h-4 w-4 text-stone-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-12">SR</th>
                            <th className="py-3 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Description</th>
                            <th className="py-3 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right w-24">Qty</th>
                            <th className="py-3 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right w-32">Price</th>
                            <th className="py-3 px-2 text-[10px] font-bold text-primary uppercase tracking-widest text-right w-24">GST %</th>
                            <th className="py-3 px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right w-32">Total</th>
                            <th className="py-3 px-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {data.items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-stone-400 bg-stone-50/30">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search className="h-8 w-8 mb-3 opacity-30" />
                                        <p className="font-bold text-sm text-stone-600">No items added yet.</p>
                                        <p className="text-xs mt-1">Select a category above to start.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.items.map((item, index) => {
                                const gstRate = item.taxes?.[0]?.percentage || 0;
                                const baseAmount = item.quantity * item.unitPrice;
                                const lineTotal = baseAmount + (baseAmount * gstRate) / 100;

                                return (
                                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors group">
                                        <td className="py-2 px-4 text-xs font-bold text-stone-400">{String(index + 1).padStart(2, "0")}</td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="text"
                                                placeholder="Item description..."
                                                value={item.description}
                                                onChange={(e) => updateField(item.id, "description", e.target.value)}
                                                className={inputClasses}
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={item.quantity || ""}
                                                onChange={(e) => updateField(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                className={`${inputClasses} text-right font-bold`}
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={item.unitPrice || ""}
                                                onChange={(e) => updateField(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                className={`${inputClasses} text-right font-bold`}
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={gstRate || ""}
                                                onChange={(e) => updateGST(item.id, item, parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-full bg-transparent border border-transparent hover:border-primary/30 focus:border-primary focus:bg-primary/5 focus:ring-1 focus:ring-primary rounded-md px-2 py-1.5 text-sm text-primary font-black text-right outline-none transition-all"
                                            />
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                            <span className="text-sm font-black text-stone-900">{formatMoney(lineTotal)}</span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="text-stone-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <button
                type="button"
                onClick={handleAddEmptyRow}
                disabled={!globalCategory}
                className="w-full py-4 flex items-center justify-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-widest hover:text-primary bg-stone-50/30 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:hover:bg-stone-50/30 disabled:hover:text-stone-500 border-t border-stone-100 outline-none"
            >
                <Plus className="h-4 w-4" />
                {globalCategory ? "Add another line item" : "Select a category to start"}
            </button>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENT 2: LiveDraftSidebar
// ============================================================================
function LiveDraftSidebar() {
    const router = useRouter(); 
    const { data, error } = useBillDraft();

    const baseAmount = data.baseAmount || 0;
    const gstAmount = data.taxAmount || 0;
    const grandTotal = data.amount || 0;

    return (
        <Card className="shadow-xl shadow-stone-200/40 border-stone-200 rounded-2xl sticky top-6 overflow-hidden">
            <CardHeader className="pb-5 border-b border-stone-100 bg-stone-50/50">
                <div className="flex items-center gap-2">
                    <ReceiptText className="h-5 w-5 text-[#ea580c]" />
                    <CardTitle className="text-lg font-black tracking-tight text-stone-900">Live Draft</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
                        ⚠️ Auto-save Error: {error}
                    </div>
                )}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-500 font-bold">Base Amount</span>
                        <span className="font-black text-stone-900">{formatMoney(baseAmount)}</span>
                    </div>
                    {gstAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#ea580c] font-bold">Total GST</span>
                            <span className="font-black text-[#ea580c]">{formatMoney(gstAmount)}</span>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-end justify-between">
                    <span className="font-bold text-[10px] text-stone-400 uppercase tracking-widest">Grand Total</span>
                    <div className="text-right">
                        <span className="text-xs font-bold text-stone-400 pr-1">PKR</span>
                        <span className="text-3xl font-black text-stone-900 leading-none">{formatMoney(grandTotal)}</span>
                    </div>
                </div>

                <div className="space-y-3 pt-6">
                    {/* ✅ THE FIXED BUTTON: Now it actually navigates! */}
                    <Button
                        onClick={() => router.push("/dashboard/bills/new/review")}
                        disabled={data.items.length === 0}
                        className="w-full h-12 text-sm font-bold bg-[#ea580c] hover:bg-[#d44d0a] text-white shadow-md shadow-orange-500/20 transition-all rounded-xl disabled:opacity-50"
                    >
                        Review & Finalize <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        disabled={data.items.length === 0}
                        className="w-full h-12 text-stone-600 font-bold border-stone-200 hover:bg-stone-50 hover:text-stone-900 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <Printer className="mr-2 h-4 w-4 text-stone-400" /> Print Draft
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// SUB-COMPONENT 3: PrintLayout
// ============================================================================
function PrintLayout() {
    // ✅ IMPROVEMENT: Using useBillDraft and completely removed 'any'
    const { data } = useBillDraft();

    if (!data || !data.items) return null;

    const baseAmount = data.baseAmount || 0;
    const gstAmount = data.taxAmount || 0;
    const grandTotal = data.amount || 0;

    return (
        <>
            {/* --- AGGRESSIVE PRINT CSS OVERRIDE --- */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print { 
                    @page { size: portrait; margin: 0mm !important; }
                    body * { visibility: hidden; }
                    #print-wrapper, #print-wrapper * { visibility: visible; }
                    #print-wrapper { 
                        position: absolute; left: 0; top: 0; width: 100vw; height: 100vh;
                        padding: 10mm; padding-top: 25mm; margin: 0; border: none !important;
                        box-shadow: none !important; background: white !important; border-radius: 0 !important;
                    }
                    html, body, main { background: white !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            ` }} />

            <div id="print-wrapper" className="bg-[#fcfaf8] w-full text-black font-sans text-[13px] leading-tight shadow-xl rounded-xl border border-slate-300 p-8 print:p-0">
                
                {/* PAGE HEADER */}
                <div className="border-b-2 border-black pb-4 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-black tracking-tight">Haseeb Traders</h2>
                            <p className="mt-1 text-sm text-black font-medium leading-relaxed">
                                Main Business Market<br />
                                Multan, Pakistan
                            </p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-4xl font-black tracking-widest text-black uppercase">BILL</h1>
                            <div className="mt-4 flex border-2 border-black text-[12px] font-bold bg-white inline-flex">
                                <div className="px-3 py-1.5 border-r-2 border-black uppercase tracking-wider">Bill No.</div>
                                <div className="px-3 py-1.5 border-r-2 border-black">{data.summaryNumber || "PENDING"}</div>
                                <div className="px-3 py-1.5 border-r-2 border-black uppercase tracking-wider">Dated</div>
                                <div className="px-3 py-1.5">{data.date}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 text-sm">
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-black border-b border-black pb-2 inline-block">Client Details</h3>
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
                                <tr key={item.id} className="divide-x-2 divide-black print:hover:bg-white hover:bg-slate-50 transition-colors">
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
                                <td className="py-3 text-[13px] text-black">{formatMoney(baseAmount)}</td>
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

                <div className="mt-12 pt-4 border-t-2 border-black flex justify-between items-end">
                    <p className="text-[10px] font-bold tracking-widest text-black uppercase">System Generated Bill - Haseeb Traders</p>
                    <div className="text-right">
                        <p className="font-bold text-black text-[10px] uppercase tracking-widest">Authorized Signature</p>
                        <div className="w-48 border-b-2 border-black mt-12 mb-1"></div>
                    </div>
                </div>
            </div>
        </>
    );
}