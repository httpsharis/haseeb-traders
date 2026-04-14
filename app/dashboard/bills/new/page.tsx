"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, FileText, Trash2, Printer } from "lucide-react";

// --- STRICT TYPES ---
interface ClientType {
    _id: string;
    name?: string;
    companyName?: string;
}

interface SummaryRecord {
    _id: string;
    summaryNumber?: string;
    client?: ClientType | string;
    date: string;
    bills?: unknown[]; 
    netPayable?: number;
    status?: string;
}

export default function AllSummariesPage() {
    const router = useRouter();
    const [summaries, setSummaries] = useState<SummaryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchSummaries();
    }, []);

    const fetchSummaries = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/summaries?t=${Date.now()}`);
            if (!res.ok) throw new Error("Failed to fetch summaries");
            
            const data = await res.json();
            
            let rawSummaries: SummaryRecord[] = [];
            
            // Standard Database Extraction
            if (Array.isArray(data)) {
                rawSummaries = data as SummaryRecord[];
            } else if (data && typeof data === 'object') {
                const dataRecord = data as Record<string, unknown>;
                
                if (Array.isArray(dataRecord.data)) rawSummaries = dataRecord.data as SummaryRecord[];
                else if (Array.isArray(dataRecord.docs)) rawSummaries = dataRecord.docs as SummaryRecord[];
                else if (Array.isArray(dataRecord.summaries)) rawSummaries = dataRecord.summaries as SummaryRecord[];
            }

            // STRICT GATEKEEPER FILTER: 
            // This guarantees that even if the backend sends Clients, they will be deleted.
            // A record MUST have a summaryNumber or netPayable to survive this filter.
            const validSummaries = rawSummaries.filter(s => {
                if (!s) return false;
                const hasSummaryNumber = typeof s.summaryNumber === 'string';
                const hasNetPayable = typeof s.netPayable === 'number';
                const hasBills = Array.isArray(s.bills);
                
                return hasSummaryNumber || hasNetPayable || hasBills;
            });
            
            // Sort by newest first based on date
            const sorted = validSummaries.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
            setSummaries(sorted);
        } catch (error) {
            console.error("Error fetching summaries:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this summary? This action cannot be undone.")) return;
        
        try {
            const res = await fetch(`/api/summaries/${id}`, { method: "DELETE" });
            if (res.ok) {
                setSummaries(prev => prev.filter(s => s._id !== id));
            }
        } catch (error) {
            console.error("Failed to delete summary", error);
        }
    };

    const getClientName = (clientData: ClientType | string | undefined | null): string => {
        if (!clientData) return "Unknown Client";
        if (typeof clientData === "string") return "Client ID: " + clientData.substring(0, 6);
        return clientData.companyName || clientData.name || "Unknown Client";
    };

    const filteredSummaries = summaries.filter(s => {
        const term = searchTerm.toLowerCase();
        const clientName = getClientName(s.client).toLowerCase();
        const sumNum = (s.summaryNumber || "").toLowerCase();
        return clientName.includes(term) || sumNum.includes(term);
    });

    const formatAmt = (num: number | undefined | null) => Number(num || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">All Summaries</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage and review your master billing ledgers.</p>
                </div>
                <Button 
                    onClick={() => router.push("/dashboard/summary/new")} 
                    className="bg-[#ea580c] text-white hover:bg-[#d44d0a] font-bold shadow-sm h-11 px-6 rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" /> Create Summary
                </Button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input 
                    type="text" 
                    placeholder="Search by Summary No. or Client Name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 h-10 outline-none font-medium text-slate-700 bg-transparent"
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-[#ea580c] mb-4" />
                        <p className="font-bold text-sm tracking-widest uppercase">Loading Summaries...</p>
                    </div>
                ) : filteredSummaries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <FileText className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="font-bold text-lg text-slate-600">No summaries found.</p>
                        <p className="text-sm mt-1">Try adjusting your search or check your backend API.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Summary No.</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest">Client</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Bills</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Net Payable</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSummaries.map((summary) => (
                                    <tr key={summary._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-900">
                                            {summary.summaryNumber || `SUM-${summary._id.substring(0, 5).toUpperCase()}`}
                                        </td>
                                        <td className="py-4 px-6 font-medium text-slate-600">
                                            {summary.date ? new Date(summary.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-800">
                                            {getClientName(summary.client)}
                                        </td>
                                        <td className="py-4 px-6 text-center font-bold text-slate-600">
                                            <span className="bg-slate-100 text-slate-600 py-1 px-3 rounded-full text-xs">
                                                {summary.bills?.length || 0}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-black text-[#ea580c] text-right">
                                            Rs {formatAmt(summary.netPayable)}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="bg-green-100 text-green-700 font-bold text-[10px] uppercase tracking-widest py-1.5 px-3 rounded-md">
                                                {summary.status || "Finalized"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right space-x-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => router.push(`/dashboard/summary/${summary._id}`)}
                                                className="text-slate-400 hover:text-[#ea580c] hover:bg-orange-50 transition-colors"
                                                title="View / Print"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDelete(summary._id)}
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}