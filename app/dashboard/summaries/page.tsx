"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, FileText, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryRow {
  _id: string;
  summaryNumber: string;
  client: { _id: string; name: string } | null;
  date: string;
  taxPeriod: string;
  status: string;
  discount: number;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Detail view
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{ summary: SummaryRow; bills: any[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/summaries?${params}`);
      const result = await res.json();
      setSummaries(result.data || []);
      setPagination(result.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
    } catch {
      console.error("Failed to fetch summaries");
    }
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const handleViewDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/summaries/${id}`);
      const data = await res.json();
      setDetailData(data);
    } catch {
      alert("Failed to load summary details.");
    }
    setDetailLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/summaries/${id}`, { method: "DELETE" });
      setDeleteId(null);
      setDetailId(null);
      fetchSummaries();
    } catch {
      alert("Failed to delete summary.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">All Summaries</h1>
        <p className="mt-1 text-sm text-slate-500">View all invoices and their current status</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by client or summary #..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-white" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-md border border-input bg-white px-3 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Converted">Converted</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-[#ea580c]" />
              <CardTitle className="text-base text-slate-800">
                {loading ? "Loading..." : `${pagination.total} Summar${pagination.total !== 1 ? "ies" : "y"}`}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Bill #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-28">Tax Period</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : summaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">No summaries found.</TableCell>
                </TableRow>
              ) : (
                summaries.map((s) => (
                  <TableRow key={s._id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => handleViewDetail(s._id)}>
                    <TableCell className="font-mono font-semibold text-slate-700">#{s.summaryNumber}</TableCell>
                    <TableCell className="font-medium text-slate-900">{s.client?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{formatDate(s.date)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{s.taxPeriod}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={s.status === "Converted" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-[#ea580c]" onClick={() => handleViewDetail(s._id)}>
                          <Eye className="size-3.5" />
                        </Button>
                        {deleteId === s._id ? (
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete(s._id)}>Yes</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDeleteId(null)}>No</Button>
                          </div>
                        ) : (
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-red-600" onClick={() => setDeleteId(s._id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-slate-600">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8">
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="h-8">
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setDetailId(null); setDetailData(null); }}>
          <Card className="w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <CardTitle>Summary Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {detailLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : detailData ? (
                <>
                  {/* Summary Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500">Summary #:</span> <span className="font-semibold ml-1">{detailData.summary.summaryNumber}</span></div>
                    <div><span className="text-slate-500">Client:</span> <span className="font-semibold ml-1">{detailData.summary.client?.name}</span></div>
                    <div><span className="text-slate-500">Date:</span> <span className="font-semibold ml-1">{formatDate(detailData.summary.date)}</span></div>
                    <div><span className="text-slate-500">Tax Period:</span> <span className="font-semibold ml-1">{detailData.summary.taxPeriod}</span></div>
                    <div><span className="text-slate-500">Status:</span> <Badge className={detailData.summary.status === "Converted" ? "ml-1 bg-green-100 text-green-700" : "ml-1 bg-amber-100 text-amber-700"}>{detailData.summary.status}</Badge></div>
                    {detailData.summary.discount > 0 && <div><span className="text-slate-500">Discount:</span> <span className="font-semibold ml-1 text-red-600">-{detailData.summary.discount.toLocaleString()}</span></div>}
                  </div>

                  {/* Bills */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Line Items ({detailData.bills.length})</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailData.bills.map((bill: any) => (
                          <TableRow key={bill._id}>
                            <TableCell className="font-medium">{bill.description} <span className="text-xs text-slate-400 ml-1">{bill.category}</span></TableCell>
                            <TableCell className="text-right">{bill.quantity}</TableCell>
                            <TableCell className="text-right">{bill.unitPrice?.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold">{(bill.quantity * bill.unitPrice)?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-500">Failed to load details.</p>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => { setDetailId(null); setDetailData(null); }}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
