"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard, Category, LineItem } from "@/components/bills";

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function LineItemsTable() {
    const { data, addItem, updateItem, removeItem } = useWizard();
    const [categories, setCategories] = useState<Category[]>([]);
    const [globalCategory, setGlobalCategory] = useState("");

    useEffect(() => {
        fetch("/api/categories")
            .then((res) => res.json())
            .then((cats) => {
                const catArray = Array.isArray(cats) ? cats : cats.data || [];
                setCategories(catArray.filter((c: Category) => c.isActive !== false));
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

    const updateField = (id: string, field: keyof LineItem, value: any) => {
        updateItem(id, { [field]: value });
    };

    const updateGST = (id: string, item: LineItem, gstPercent: number) => {
        if (gstPercent <= 0) {
            updateItem(id, { taxes: [] });
            return;
        }
        const baseAmount = item.quantity * item.unitPrice;
        updateItem(id, {
            taxes: [{
                name: "GST",
                percentage: gstPercent,
                baseAmount: baseAmount,
                amount: (baseAmount * gstPercent) / 100
            }]
        });
    };

    const inputClasses = "w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-[#ea580c] focus:bg-white rounded-md px-2 py-1.5 text-sm text-slate-900 font-medium outline-none transition-all";

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

            {/* The Arrow Nuke: This absolutely forces the browser to hide the spin buttons */}
            <style dangerouslySetInnerHTML={{
                __html: `
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }
            `}} />

            {/* Header Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-base font-bold text-slate-800">Line Items</h2>
                <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">Category:</label>
                    <div className="relative group w-full sm:w-64">
                        <select
                            value={globalCategory}
                            onChange={(e) => setGlobalCategory(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all appearance-none cursor-pointer text-slate-900"
                        >
                            <option value="">Select category...</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400 group-focus-within:text-[#ea580c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Traditional HTML Table for Perfect Alignment */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">SR</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-24">Qty</th>
                            <th className="py-3 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-32">Price</th>
                            <th className="py-3 px-2 text-xs font-bold text-orange-600 uppercase tracking-wider text-right w-24">GST %</th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-32">Total</th>
                            <th className="py-3 px-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400 bg-slate-50/50">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search className="h-8 w-8 mb-3 opacity-30" />
                                        <p className="font-medium text-sm">No items added yet.</p>
                                        <p className="text-xs mt-1">Select a category above to start.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.items.map((item, index) => {
                                const gstRate = item.taxes?.[0]?.percentage || 0;
                                const baseAmount = item.quantity * item.unitPrice;
                                const lineTotal = baseAmount + ((baseAmount * gstRate) / 100);

                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-2 px-4 text-sm font-medium text-slate-400">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
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
                                                className={`${inputClasses} text-right`}
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={item.unitPrice || ""}
                                                onChange={(e) => updateField(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                className={`${inputClasses} text-right`}
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="number"
                                                value={gstRate || ""}
                                                onChange={(e) => updateGST(item.id, item, parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-full bg-transparent border border-transparent hover:border-orange-200 focus:border-orange-400 focus:bg-orange-50 rounded-md px-2 py-1.5 text-sm text-orange-700 font-bold text-right outline-none transition-all"
                                            />
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                            <span className="text-sm font-bold text-slate-700">
                                                {formatMoney(lineTotal)}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-all opacity-0 group-hover:opacity-100"
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

            {/* Footer Action */}
            <button
                type="button"
                onClick={handleAddEmptyRow}
                disabled={!globalCategory}
                className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#ea580c] bg-slate-50/30 hover:bg-orange-50/50 transition-colors disabled:opacity-50 disabled:hover:bg-slate-50/30 disabled:hover:text-slate-500 border-t border-slate-100 outline-none"
            >
                <Plus className="h-4 w-4" />
                {globalCategory ? "Add another line item" : "Select a category above to start adding items"}
            </button>
        </div>
    );
}