"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileText, Loader2, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataPage";
// import { Summary } from '../../../types/summary';

// Adjust this interface based on your exact database schema
interface Summary {
    _id: string;
    summaryNumber: string;
    date: string;
    client: { _id: string; name: string } | string; // Handles both populated and unpopulated clients
    category?: string;
    status: string;
    amount: number;
}

export default function AllSummariesPage() {
    const router = useRouter();
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchSummaries = async () => {
        setIsLoading(true);
        try {
            // Adjust this endpoint if you use /api/bills instead
            const res = await fetch(`/api/summaries`); 
            const data = await res.json();
            setSummaries(Array.isArray(data) ? data : data.data || []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchSummaries(); }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/summaries/${id}`, { method: "DELETE" }); // Adjust endpoint if needed
            if (res.ok) setSummaries((prev) => prev.filter((s) => s._id !== id));
        } finally {
            setIsDeleting(null);
        }
    };

    // Helper to format money safely
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 2,
        }).format(amount || 0).replace("PKR", "Rs");
    };

    // Helper to get client name whether populated or not
    const getClientName = (client: { _id: string; name: string } | string | null | undefined) => {
        if (!client) return "Unknown Client";
        if (typeof client === "string") return client;
        return client.name || "Unknown Client";
    };

    // ── DEFINE HOW THE COLUMNS SHOULD RENDER ──
    const summaryColumns: ColumnDef<Summary>[] = [
        { 
            header: "No.", 
            className: "font-black text-stone-900 pl-6 w-32", 
            cell: (s) => s.summaryNumber 
        },
        { 
            header: "Date", 
            className: "text-stone-500 font-medium text-xs w-32", 
            cell: (s) => s.date ? new Date(s.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—" 
        },
        { 
            header: "Client", 
            className: "font-bold text-stone-700", 
            cell: (s) => getClientName(s.client)
        },
        { 
            header: "Category", 
            className: "text-stone-500 font-medium text-xs", 
            cell: (s) => s.category || <span className="text-stone-300 italic">General</span>
        },
        { 
            header: "Status", 
            className: "w-32", 
            cell: (s) => {
                // Sleek dynamic badge based on status
                const isPaid = s.status?.toUpperCase() === "PAID";
                return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        isPaid ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {s.status || "UNBILLED"}
                    </span>
                )
            }
        },
        { 
            header: "Amount", 
            className: "text-right font-black text-stone-900 w-32", 
            cell: (s) => formatMoney(s.amount)
        },
        {
            header: "Actions",
            className: "text-right pr-6 w-24",
            cell: (s) => (
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-stone-400 hover:text-primary hover:bg-primary/10" 
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/bills/${s._id}`); // Teleport to the Edit Loader!
                        }}
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50" 
                        onClick={(e) => handleDelete(s._id, e)}
                    >
                        {isDeleting === s._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-stone-900 tracking-tight">All Summaries</h1>
                    <p className="mt-1 font-medium text-stone-500">Manage, filter, and review your invoice directory.</p>
                </div>
                <Button 
                    onClick={() => router.push("/dashboard/bills/new?fresh=true")}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create New
                </Button>
            </div>

            <DataTable 
                data={summaries}
                columns={summaryColumns}
                isLoading={isLoading}
                searchPlaceholder="Search invoices, clients, or categories..."
                emptyIcon={<FileText className="h-10 w-10 mx-auto" />}
                emptyMessage="No summaries found."
                // Define how searching works here
                filterFn={(summary, term) => 
                    (summary.summaryNumber || "").toLowerCase().includes(term) || 
                    getClientName(summary.client).toLowerCase().includes(term) ||
                    (summary.category || "").toLowerCase().includes(term)
                }
                // Custom sort options for financial data
                sortOptions={[
                    { label: "Newest First", value: "NEWEST" },
                    { label: "Oldest First", value: "OLDEST" },
                    { label: "Amount: High to Low", value: "AMOUNT_DESC" },
                    { label: "Amount: Low to High", value: "AMOUNT_ASC" }
                ]}
                defaultSort="NEWEST"
                // Define how sorting works here
                sortFn={(a, b, sortOrder) => {
                    if (sortOrder === "NEWEST") return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
                    if (sortOrder === "OLDEST") return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
                    if (sortOrder === "AMOUNT_DESC") return (b.amount || 0) - (a.amount || 0);
                    if (sortOrder === "AMOUNT_ASC") return (a.amount || 0) - (b.amount || 0);
                    return 0;
                }}
            />
        </div>
    );
}