"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function PendingBillsPage() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "Draft", page: String(page), limit: "15" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/summaries?${params}`);
      const result = await res.json();
      setSummaries(result.data || []);
      setPagination(result.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
    } catch {
      console.error("Failed to fetch pending bills");
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pending Bills</h1>
        <p className="mt-1 text-sm text-slate-500">Draft invoices awaiting tax processing and finalization</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search by client or bill #..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-white" />
      </div>

      {/* Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-amber-600" />
            <CardTitle className="text-base text-slate-800">
              {loading ? "Loading..." : `${pagination.total} Pending`}
            </CardTitle>
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
                <TableHead className="w-28 text-right">Action</TableHead>
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
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    {search ? "No pending bills match your search." : "No pending bills. All invoices have been processed!"}
                  </TableCell>
                </TableRow>
              ) : (
                summaries.map((s) => (
                  <TableRow key={s._id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => router.push(`/dashboard/pending-bills/${s._id}`)}>
                    <TableCell className="font-mono font-semibold text-slate-700">#{s.summaryNumber}</TableCell>
                    <TableCell className="font-medium text-slate-900">{s.client?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{formatDate(s.date)}</TableCell>
                    <TableCell className="text-sm text-slate-600">{s.taxPeriod}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Draft</Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        className="h-7 gap-1 bg-[#ea580c] hover:bg-[#c2410c] text-xs"
                        onClick={() => router.push(`/dashboard/pending-bills/${s._id}`)}
                      >
                        Process <ArrowRight className="size-3" />
                      </Button>
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
    </div>
  );
}
