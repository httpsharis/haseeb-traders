"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Printer, Download, ArrowLeft, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard } from "@/components/bills";

export function ReviewSidebar() {
    const router = useRouter();
    const { data } = useWizard();
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleFinalize = async () => {
        setIsSaving(true);
        setError("");

        try {
            const bills = data.items.map((item, idx) => ({
                billNumber: item.billNumber || `${data.summaryNumber}-${idx + 1}`,
                date: item.date || data.date,
                description: item.description,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxes: item.taxes,
            }));

            const payload = {
                client: data.clientId,
                summaryNumber: data.summaryNumber,
                date: data.date,
                taxPeriod: data.taxPeriod,
                status: "Draft", // Always saved as Draft first
                discount: data.discount || 0,
                commission: data.commission || 0,
                bills,
            };

            const res = await fetch("/api/summaries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save invoice");
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to save to database");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 print:hidden">

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-1.5 bg-orange-50 rounded-md text-[#ea580c]">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-slate-900">Actions</h3>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">{error}</div>}

                {/* Animated Smart Button */}
                <Button
                    onClick={handleFinalize}
                    disabled={isSaving || isSuccess}
                    className={`w-full h-12 font-bold shadow-md transition-all duration-300 rounded-lg text-white ${isSuccess
                            ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                            : "bg-[#ea580c] hover:bg-[#d44d0a] shadow-orange-500/20"
                        }`}
                >
                    {isSuccess ? (
                        <><CheckCircle2 className="mr-2 h-5 w-5 animate-in zoom-in duration-300" /> Invoice Saved!</>
                    ) : isSaving ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving to Database...</>
                    ) : (
                        <><CheckCircle2 className="mr-2 h-5 w-5" /> Finalize & Save</>
                    )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => window.print()} className="h-11 font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 rounded-lg">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" className="h-11 font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 rounded-lg">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    <div className="flex justify-between items-center p-4">
                        <span className="text-sm font-medium text-slate-500">Recipient</span>
                        <span className="text-sm font-bold text-slate-900">{data.clientName}</span>
                    </div>
                    <div className="flex justify-between items-center p-4">
                        <span className="text-sm font-medium text-slate-500">Total Items</span>
                        <span className="text-sm font-bold text-slate-900">{data.items.length} Items</span>
                    </div>
                    <div className="flex justify-between items-center p-4">
                        <span className="text-sm font-medium text-slate-500">Currency</span>
                        <span className="text-sm font-bold text-slate-900">PKR (Rs)</span>
                    </div>
                </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-orange-800 leading-relaxed">
                    Once finalized, this invoice will be assigned a permanent status and can be tracked in your dashboard.
                </p>
            </div>
        </div>
    );
}