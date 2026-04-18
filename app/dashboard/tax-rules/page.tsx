"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Percent, Calculator, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, ColumnDef } from "@/components/ui/DataPage";

// ✅ UPDATED to match your backend schema exactly!
export interface TaxRule {
    _id: string;
    name: string; 
    percentage: number; 
    target?: string;
    impact?: string;
    isActive?: boolean;
    createdAt?: string;
}

export default function AllTaxTypesPage() {
    const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showAddRule, setShowAddRule] = useState(false);

    const fetchTaxRules = async () => {
        setIsLoading(true);
        try {
            // ✅ UPDATED to your exact API endpoint
            const res = await fetch(`/api/tax-types`);
            const data = await res.json();
            setTaxRules(Array.isArray(data) ? data : data.data || []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTaxRules(); }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this tax type?")) return;
        setIsDeleting(id);
        try {
            // ✅ UPDATED endpoint
            const res = await fetch(`/api/tax-types/${id}`, { method: "DELETE" });
            if (res.ok) setTaxRules((prev) => prev.filter((t) => t._id !== id));
        } finally {
            setIsDeleting(null);
        }
    };

    const handleRuleAdded = (newRule: TaxRule) => {
        setTaxRules(prev => [...prev, newRule]);
        setShowAddRule(false);
    };

    // ── DEFINE HOW THE COLUMNS SHOULD RENDER ──
    const taxColumns: ColumnDef<TaxRule>[] = [
        { 
            header: "Tax Name", 
            className: "font-black text-stone-900 pl-6 w-1/4", 
            cell: (t) => (
                <div className="flex items-center">
                    <Calculator className="w-4 h-4 mr-2 text-primary/60" />
                    {t.name}
                </div>
            )
        },
        { 
            header: "Rate (%)", 
            className: "font-bold text-stone-900 w-32", 
            cell: (t) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-black bg-stone-100 text-stone-700 border border-stone-200">
                    {t.percentage}%
                </span>
            )
        },
        { 
            header: "Status", 
            className: "w-32", 
            cell: (t) => {
                // ✅ NEW: Sleek status badge based on your isActive boolean
                const active = t.isActive !== false; // Defaults to true if undefined
                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-stone-50 text-stone-500 border border-stone-200"
                    }`}>
                        {active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {active ? "Active" : "Disabled"}
                    </span>
                )
            }
        },
        { 
            header: "Engine Rules", 
            className: "text-stone-500 font-medium text-xs", 
            cell: (t) => (
                <div className="flex flex-col">
                    <span>{t.impact === "Subtract" ? "Deducts from" : "Adds to"} <strong className="text-stone-700">{t.target || "Base Amount"}</strong></span>
                </div>
            )
        },
        {
            header: "Actions",
            className: "text-right pr-6 w-24",
            cell: (t) => (
                <div className="flex justify-end transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => handleDelete(t._id, e)}>
                        {isDeleting === t._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-stone-900 tracking-tight">Tax Types</h1>
                    <p className="mt-1 font-medium text-stone-500">Manage tax rules and deduction percentages.</p>
                </div>
                <Button 
                    onClick={() => setShowAddRule(true)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Tax Type
                </Button>
            </div>

            <DataTable 
                data={taxRules}
                columns={taxColumns}
                isLoading={isLoading}
                searchPlaceholder="Search tax names..."
                emptyIcon={<Percent className="h-10 w-10 mx-auto" />}
                emptyMessage="No tax types found."
                filterFn={(rule, term) => 
                    (rule.name || "").toLowerCase().includes(term)
                }
                sortOptions={[
                    { label: "Name (A-Z)", value: "A_Z" },
                    { label: "Name (Z-A)", value: "Z_A" },
                    { label: "Rate (High to Low)", value: "RATE_DESC" },
                    { label: "Rate (Low to High)", value: "RATE_ASC" }
                ]}
                defaultSort="A_Z"
                sortFn={(a, b, sortOrder) => {
                    if (sortOrder === "A_Z") return (a.name || "").localeCompare(b.name || "");
                    if (sortOrder === "Z_A") return (b.name || "").localeCompare(a.name || "");
                    if (sortOrder === "RATE_DESC") return (b.percentage || 0) - (a.percentage || 0);
                    if (sortOrder === "RATE_ASC") return (a.percentage || 0) - (b.percentage || 0);
                    return 0;
                }}
            />

            {showAddRule && (
                <AddTaxRulePopup 
                    onClose={() => setShowAddRule(false)} 
                    onSuccess={handleRuleAdded} 
                />
            )}
        </div>
    );
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================
function AddTaxRulePopup({ onClose, onSuccess }: { onClose: () => void, onSuccess: (rule: TaxRule) => void }) {
    const [name, setName] = useState("");
    const [percentage, setPercentage] = useState("");
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (!name.trim() || !percentage) return;
        setSaving(true);
        try {
            // ✅ UPDATED endpoint
            const res = await fetch("/api/tax-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name: name.trim().toUpperCase(),
                    percentage: parseFloat(percentage),
                    isActive: true, // Explicitly tell the backend this is an active tax
                }),
            });
            const newRule = await res.json();
            onSuccess(newRule);
        } catch (err) {
            console.error("Failed to create tax type", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-black text-stone-900 tracking-tight">Add New Tax Type</h2>
                        <p className="text-sm font-medium text-stone-500 mt-1">Create a preset percentage to apply to items.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Tax Name</label>
                                <Input
                                    placeholder="e.g. GST, WHT"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                    className="h-11 w-full bg-stone-50/50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-none rounded-lg font-medium uppercase"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Rate (%)</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="18"
                                        value={percentage}
                                        onChange={(e) => setPercentage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && name.trim() && percentage) {
                                                e.preventDefault();
                                                handleCreate();
                                            }
                                        }}
                                        className="h-11 w-full bg-stone-50/50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-none rounded-lg font-black pr-8"
                                    />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose} className="h-10 px-4 text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-bold rounded-lg shadow-none">
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={saving || !name.trim() || !percentage} className="h-10 px-6 font-bold shadow-none rounded-lg disabled:opacity-50 bg-primary text-white hover:bg-primary/90">
                            {saving ? "Saving..." : "Save Rule"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}