"use client";

// Format money for printing
function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function PrintLayout({ data }: { data: any }) {
    if (!data.items) return null;

    const baseAmount = data.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const gstAmount = data.items.reduce((sum: number, item: any) => {
        const itemGst = item.taxes?.find((t: any) => t.name === "GST");
        return sum + (itemGst ? itemGst.amount : 0);
    }, 0);
    const grandTotal = baseAmount + gstAmount;

    return (
        <div>
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Haseeb Traders</h2>
                    <p className="mt-1 text-sm text-slate-600 font-medium">
                        Main Business Market<br />
                        Multan, Pakistan
                    </p>
                </div>
                <div className="text-right">
                    <h1 className="text-5xl font-black tracking-widest text-[#ea580c] uppercase">BILL</h1>
                    <p className="mt-4 text-sm font-bold text-slate-800">Bill No. {data.summaryNumber}</p>
                    <p className="text-sm text-slate-500 font-medium">Date: {data.date}</p>
                </div>
            </div>

            <div className="mb-10 text-sm">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2">Client Details</h3>
                <p className="font-black text-lg text-slate-900">{data.clientName}</p>
            </div>

            <table className="w-full text-sm mb-12">
                <thead>
                    <tr className="border-b-2 border-slate-900 text-left">
                        <th className="py-3 font-bold uppercase tracking-wider text-slate-900 text-xs w-12 rounded-tl-sm">Sr</th>
                        <th className="py-3 font-bold uppercase tracking-wider text-slate-900 text-xs text-left">Description</th>
                        <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs w-24">Qty</th>
                        <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs w-32">Unit Price</th>
                        <th className="py-3 text-right font-bold uppercase tracking-wider text-slate-900 text-xs w-32 rounded-tr-sm">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {data.items.map((item: any, idx: number) => (
                        <tr key={item.id} className="even:bg-slate-50/50">
                            <td className="py-4 text-slate-500 font-medium">{String(idx + 1).padStart(2, '0')}</td>
                            <td className="py-4">
                                <p className="font-bold text-slate-900">{item.description}</p>
                                <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">{item.category}</p>
                            </td>
                            <td className="py-4 text-right text-slate-700 font-medium">{item.quantity}</td>
                            <td className="py-4 text-right text-slate-700 font-medium">{formatMoney(item.unitPrice)}</td>
                            <td className="py-4 text-right font-black text-slate-900">{formatMoney(item.quantity * item.unitPrice)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-72 space-y-3 text-sm">
                    <div className="flex justify-between items-center text-slate-600">
                        <span className="font-medium">Subtotal</span>
                        <span className="font-bold">{formatMoney(baseAmount)}</span>
                    </div>
                    {gstAmount > 0 && (
                        <div className="flex justify-between items-center text-slate-600">
                            <span className="font-medium">Total GST</span>
                            <span className="font-bold">{formatMoney(gstAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center border-t border-slate-900 pt-3 text-xl font-black text-slate-900">
                        <span className="uppercase text-sm tracking-widest text-[#ea580c]">Total Payment</span>
                        <span>Rs {formatMoney(grandTotal)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-24 pt-4 border-t border-slate-300 flex justify-between items-end">
                <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">System Generated Bill - Haseeb Traders</p>
                <div className="text-right">
                    <p className="font-medium text-slate-600 text-sm">Authorized Signature</p>
                    <div className="w-48 border-b-2 border-slate-800 mt-12 mb-1"></div>
                </div>
            </div>
        </div>
    );
}