"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Printer, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWizard } from "@/components/bills";

// Helper
function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function LiveDraftSidebar() {
    const router = useRouter();
    const { data } = useWizard();

    // Calculations
    const baseAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const gstAmount = data.items.reduce((sum, item) => {
        const itemGst = item.taxes?.find(t => t.name === "GST");
        return sum + (itemGst ? itemGst.amount : 0);
    }, 0);
    const grandTotal = baseAmount + gstAmount;

    return (
        <Card className="shadow-xl shadow-slate-200/40 border-slate-100 rounded-2xl sticky top-6 overflow-hidden">
            <CardHeader className="pb-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <ReceiptText className="h-5 w-5 text-[#ea580c]" />
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Live Draft</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-white">

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Base Amount</span>
                        <span className="font-bold text-slate-900">{formatMoney(baseAmount)}</span>
                    </div>
                    {gstAmount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#ea580c] font-medium">Total GST</span>
                            <span className="font-bold text-[#ea580c]">{formatMoney(gstAmount)}</span>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
                    <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">Total</span>
                    <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 pr-1">PKR</span>
                        <span className="text-3xl font-black text-slate-900 leading-none">
                            {formatMoney(grandTotal)}
                        </span>
                    </div>
                </div>

                <div className="space-y-3 pt-6">
                    <Button
                        onClick={() => router.push("/dashboard/bills/new/summary")}
                        disabled={data.items.length === 0}
                        className="w-full bg-[#ea580c] hover:bg-[#d44d0a] text-white h-12 text-sm font-bold shadow-md shadow-orange-500/20 transition-all rounded-xl disabled:opacity-50"
                    >
                        Review & Finalize <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        disabled={data.items.length === 0}
                        className="w-full h-12 text-slate-600 font-semibold border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <Printer className="mr-2 h-4 w-4 text-slate-400" /> Print Draft
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}