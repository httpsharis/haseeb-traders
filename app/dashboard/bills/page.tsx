"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, ExternalLink, FileText, CheckCircle2, Clock, Loader2, Filter, ArrowDownUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Bill } from "@/types";

function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount || 0);
}

export default function AllBillsPage() {
    const router = useRouter();
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // ── Filters & Pagination State ──
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("NEWEST");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchBills = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/bills`);
            if (!res.ok) throw new Error("Failed to fetch bills");
            const data = await res.json();
            setBills(Array.isArray(data) ? data : data.bills || data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    // ── SMART RESET ──
    // If the user searches or changes a filter, snap them back to Page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortOrder]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this bill? This cannot be undone.")) return;
        
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
            if (res.ok) setBills((prev) => prev.filter((b) => b._id !== id));
        } catch (error) {
            console.error("Error deleting bill:", error);
        } finally {
            setIsDeleting(null);
        }
    };

    // ── 1. FILTER & SORT ENGINE ──
    const processedBills = useMemo(() => {
        let result = [...bills];

        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter((bill) => {
                const billNo = (bill.billNumber || "").toLowerCase();
                const desc = (bill.description || bill.category || "").toLowerCase();
                const clientName = bill.client && typeof bill.client !== "string" 
                    ? (bill.client.companyName || bill.client.name || "").toLowerCase() 
                    : "";
                return billNo.includes(term) || desc.includes(term) || clientName.includes(term);
            });
        }

        if (statusFilter !== "ALL") {
            result = result.filter(bill => 
                statusFilter === "SUMMARIZED" ? bill.status === "Summarized" : bill.status !== "Summarized"
            );
        }

        result.sort((a, b) => {
            if (sortOrder === "NEWEST") return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
            if (sortOrder === "OLDEST") return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
            if (sortOrder === "AMOUNT_HIGH") return (b.amount || 0) - (a.amount || 0);
            if (sortOrder === "AMOUNT_LOW") return (a.amount || 0) - (b.amount || 0);
            return 0;
        });

        return result;
    }, [bills, searchTerm, statusFilter, sortOrder]);

    // ── 2. PAGINATION ENGINE ──
    const totalPages = Math.ceil(processedBills.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    // Chop the array to only show the current 10 items
    const currentBills = processedBills.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-stone-900">All Bills</h1>
                    <p className="mt-1 font-medium text-stone-500">Manage, filter, and review your invoice directory.</p>
                </div>
                <Button
                    onClick={() => router.push("/dashboard/bills/new")}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-md shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create New Bill
                </Button>
            </div>

            <Card className="border border-stone-200 shadow-xl shadow-stone-200/40 overflow-hidden rounded-2xl bg-white flex flex-col">
                
                {/* ── CONTROL BAR ── */}
                <div className="bg-stone-50/80 border-b border-stone-100 p-4 sm:px-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex items-center group">
                            <Filter className="absolute left-3 h-4 w-4 text-stone-400 group-hover:text-stone-900 transition-colors pointer-events-none" />
                            <select 
                                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 pl-9 pr-8 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer shadow-sm hover:border-stone-300 transition-all"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="UNBILLED">Unbilled</option>
                                <option value="SUMMARIZED">Summarized</option>
                            </select>
                        </div>

                        <div className="relative flex items-center group">
                            <ArrowDownUp className="absolute left-3 h-4 w-4 text-stone-400 group-hover:text-stone-900 transition-colors pointer-events-none" />
                            <select 
                                value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                                className="h-10 pl-9 pr-8 bg-white border border-stone-200 rounded-lg text-sm font-bold text-stone-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer shadow-sm hover:border-stone-300 transition-all"
                            >
                                <option value="NEWEST">Newest First</option>
                                <option value="OLDEST">Oldest First</option>
                                <option value="AMOUNT_HIGH">Highest Amount</option>
                                <option value="AMOUNT_LOW">Lowest Amount</option>
                            </select>
                        </div>
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search invoices..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-white border-stone-200 focus-visible:ring-1 focus-visible:ring-primary rounded-lg font-medium shadow-sm transition-all"
                        />
                    </div>
                </div>

                {/* ── TABLE AREA ── */}
                <CardContent className="p-0 overflow-x-auto grow">
                    <Table>
                        <TableHeader className="bg-stone-50/30">
                            <TableRow className="hover:bg-transparent border-stone-100">
                                <TableHead className="w-32 font-bold text-stone-400 uppercase tracking-widest text-[10px] py-4 pl-6">Bill No.</TableHead>
                                <TableHead className="font-bold text-stone-400 uppercase tracking-widest text-[10px] py-4">Date</TableHead>
                                <TableHead className="font-bold text-stone-400 uppercase tracking-widest text-[10px] py-4">Client</TableHead>
                                <TableHead className="font-bold text-stone-400 uppercase tracking-widest text-[10px] py-4 hidden md:table-cell">Category</TableHead>
                                <TableHead className="font-bold text-stone-400 uppercase tracking-widest text-[10px] py-4 text-center">Status</TableHead>
                                <TableHead className="font-bold text-stone-400 uppercase tracking-widest text-[10px] py-4 text-right">Amount</TableHead>
                                <TableHead className="w-24 text-right font-bold text-stone-400 uppercase tracking-widest text-[10px] py-4 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-stone-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="hover:bg-transparent">
                                        <TableCell className="pl-6"><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell align="center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                        <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                    </TableRow>
                                ))
                            ) : currentBills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center text-stone-400 bg-stone-50/30">
                                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="font-bold text-sm text-stone-600">No bills found.</p>
                                        <p className="text-xs mt-1">Try adjusting your filters or create a new bill.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentBills.map((bill) => {
                                    const clientName = bill.client && typeof bill.client !== "string" 
                                        ? bill.client.companyName || bill.client.name || "Unknown Client" 
                                        : "Unknown Client";
                                    const isSummarized = bill.status === "Summarized";

                                    return (
                                        <TableRow
                                            key={bill._id}
                                            className="group hover:bg-stone-50/80 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/dashboard/bills/${bill._id}`)}
                                        >
                                            <TableCell className="font-black text-stone-900 pl-6">
                                                {bill.billNumber || `#${bill._id.slice(-5).toUpperCase()}`}
                                            </TableCell>
                                            <TableCell className="text-stone-600 font-medium text-sm">
                                                {bill.date ? new Date(bill.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                            </TableCell>
                                            <TableCell className="font-bold text-stone-800">
                                                {clientName}
                                            </TableCell>
                                            <TableCell className="text-stone-500 font-medium text-xs hidden md:table-cell">
                                                <span className="line-clamp-1 max-w-62.5" title={bill.category}>
                                                    {bill.category || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Badge
                                                    variant="outline"
                                                    className={`font-bold border text-[10px] uppercase tracking-widest px-2.5 py-0.5 ${
                                                        isSummarized ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-600 border-stone-200"
                                                    } transition-colors`}
                                                >
                                                    {isSummarized ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Summarized</> : <><Clock className="w-3 h-3 mr-1" /> Unbilled</>}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-black text-stone-900">
                                                Rs {formatMoney(bill.amount)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost" size="icon" title="Open Bill"
                                                        className="h-8 w-8 text-stone-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                                                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/bills/${bill._id}`); }}
                                                    ><ExternalLink className="h-4 w-4" /></Button>
                                                    <Button
                                                        variant="ghost" size="icon" title="Delete Bill" disabled={isDeleting === bill._id}
                                                        className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        onClick={(e) => handleDelete(bill._id, e)}
                                                    >
                                                        {isDeleting === bill._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* ── PAGINATION FOOTER ── */}
                {!isLoading && processedBills.length > 0 && (
                    <div className="bg-stone-50/80 border-t border-stone-100 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, processedBills.length)} of {processedBills.length}
                        </p>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="h-9 px-3 font-bold text-stone-600 border-stone-200 hover:bg-white hover:text-stone-900 rounded-lg shadow-sm disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                            </Button>
                            
                            <div className="flex items-center justify-center min-w-12 text-sm font-black text-stone-700">
                                {currentPage} <span className="text-stone-400 mx-1 font-medium">/</span> {totalPages}
                            </div>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="h-9 px-3 font-bold text-stone-600 border-stone-200 hover:bg-white hover:text-stone-900 rounded-lg shadow-sm disabled:opacity-50"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}