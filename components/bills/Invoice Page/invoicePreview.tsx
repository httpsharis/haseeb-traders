"use client";

import { useWizard } from "@/components/bills";

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function InvoicePreview() {
    const { data } = useWizard();

    const baseAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const gstAmount = data.items.reduce((sum, item) => {
        const itemGst = item.taxes?.find(t => t.name === "GST");
        return sum + (itemGst ? itemGst.amount : 0);
    }, 0);
    const grandTotal = baseAmount + gstAmount;

    return (
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Minimalist Top Bar (Hidden on Print) */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Preview</span>
                <span className="text-xs font-medium text-slate-500">{data.summaryNumber}</span>
            </div>

            {/* The Actual Paper Document */}
            <div className="p-8 sm:p-12 bg-white">
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Haseeb Traders</h2>
                        <p className="mt-1 text-sm text-slate-500 font-medium leading-relaxed">
                            Main Business Market<br />
                            Multan, Pakistan
                        </p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-black tracking-widest text-slate-200 uppercase">INVOICE</h1>
                        <p className="mt-4 text-sm font-bold text-slate-900"># {data.summaryNumber}</p>
                        <p className="text-sm text-slate-500 font-medium">Date: {data.date}</p>
                    </div>
                </div>

                <div className="mb-12">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
                    <p className="text-lg font-bold text-slate-900">{data.clientName}</p>
                </div>

                <table className="w-full text-sm mb-12">
                    <thead>
                        <tr className="border-b-2 border-slate-900 text-left">
                            <th className="py-3 font-bold uppercase tracking-wider text-slate-900 text-xs text-left">Description</th>
                            <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs w-24">Qty</th>
                            <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs w-32">Unit Price</th>
                            <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4">
                                    <p className="font-bold text-slate-900">{item.description}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{item.category}</p>
                                </td>
                                <td className="py-4 text-right text-slate-700 font-medium">{item.quantity}</td>
                                <td className="py-4 text-right text-slate-700 font-medium">{formatMoney(item.unitPrice)}</td>
                                <td className="py-4 text-right font-bold text-slate-900">{formatMoney(item.quantity * item.unitPrice)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-16">
                    <div className="w-72 space-y-4 text-sm">
                        <div className="flex justify-between items-center text-slate-600">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold text-slate-900">{formatMoney(baseAmount)}</span>
                        </div>
                        {gstAmount > 0 && (
                            <div className="flex justify-between items-center text-slate-600">
                                <span className="font-medium">GST</span>
                                <span className="font-bold text-slate-900">{formatMoney(gstAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center border-t-2 border-slate-900 pt-4 text-lg font-black text-slate-900">
                            <span>Total Amount</span>
                            <span className="text-[#ea580c]">{formatMoney(grandTotal)}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-100 text-center">
                    <p className="text-xs font-semibold tracking-widest text-slate-300 uppercase">
                        Haseeb Traders | Verified Electronic Document
                    </p>
                </div>
            </div>
        </div>
    );
}