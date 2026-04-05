"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, ExternalLink, FileText, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientType {
  _id: string;
  name?: string;
  companyName?: string;
}

interface BillItem {
  amount?: string | number;
  total?: string | number;
  quantity?: string | number;
  price?: string | number;
  unitPrice?: string | number;
  rate?: string | number;
}

interface Bill {
  _id: string;
  billNumber?: string;
  category?: string;
  description?: string;
  date?: string;
  status?: "Unbilled" | "Summarized" | "Paid" | string;
  client?: ClientType | string | null;
  
  // Amounts
  baseAmount?: number | string;
  amount?: number | string;
  subTotal?: number | string;
  totalAmount?: number | string;
  netAmount?: number | string;
  total?: number | string;
  quantity?: number | string;
  unitPrice?: number | string;
  price?: number | string;
  items?: BillItem[];
}

// Helper to safely parse numbers
function parseAmt(val: string | number | undefined | null): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const num = Number(val.toString().replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

// Re-using the robust calculation from the summary wizard
function getBaseAmount(bill: Bill): number {
  const directTotals = [bill.baseAmount, bill.amount, bill.subTotal, bill.totalAmount, bill.netAmount, bill.total];
  for (const t of directTotals) {
    const val = parseAmt(t);
    if (val > 0) return val;
  }

  if (Array.isArray(bill.items) && bill.items.length > 0) {
    let sum = 0;
    bill.items.forEach((item) => {
      const itemTotal = parseAmt(item.amount) || parseAmt(item.total) || ((parseAmt(item.quantity) || 1) * parseAmt(item.price || item.unitPrice || item.rate));
      sum += itemTotal;
    });
    if (sum > 0) return sum;
  }

  const flat = (parseAmt(bill.quantity) || 1) * parseAmt(bill.unitPrice || bill.price);
  return flat > 0 ? flat : 0;
}

export default function AllBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchBills = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/bills?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch bills");
      const data = await res.json();
      
      const arr = Array.isArray(data) ? data : (data.bills || data.data || []);
      setBills(arr);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this bill? This cannot be undone.")) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBills((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (error) {
      console.error("Error deleting bill:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredBills = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return bills;

    return bills.filter((bill) => {
      const billNo = (bill.billNumber || "").toLowerCase();
      const desc = (bill.description || bill.category || "").toLowerCase();
      
      let clientName = "";
      if (bill.client && typeof bill.client !== "string") {
        clientName = (bill.client.name || bill.client.companyName || "").toLowerCase();
      }

      return billNo.includes(term) || desc.includes(term) || clientName.includes(term);
    });
  }, [bills, searchTerm]);

  return (
    <div className="p-6 md:p-10 max-w-350 mx-auto pb-32 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">All Bills</h1>
          <p className="mt-1 font-medium text-slate-500">Manage, filter, and review all your raw bills.</p>
        </div>
        <Button 
          onClick={() => router.push("/dashboard/bills/new")}
          className="gap-2 h-12 px-8 bg-[#ea580c] hover:bg-[#d44d0a] shadow-md shadow-orange-500/10 font-black rounded-xl text-base transition-all shrink-0"
        >
          <Plus className="size-5" /> Create Bill
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b bg-slate-50/50 pb-5 pt-6 px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                <FileText className="size-5 text-[#ea580c]" />
              </div>
              <CardTitle className="text-xl font-black text-slate-800">
                {isLoading ? "Loading Bills..." : `Bill Directory (${filteredBills.length})`}
              </CardTitle>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search bills, clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-[#ea580c] rounded-xl font-medium shadow-sm transition-all"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="w-30 font-black text-slate-500 uppercase tracking-wider text-xs py-4 pl-6">Bill No.</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-wider text-xs py-4">Date</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-wider text-xs py-4">Client</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-wider text-xs py-4 hidden md:table-cell">Details / Category</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-wider text-xs py-4 text-center">Status</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-wider text-xs py-4 text-right">Amount</TableHead>
                <TableHead className="w-25 text-right font-black text-slate-500 uppercase tracking-wider text-xs py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
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
              ) : filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500 bg-slate-50/30">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-sm">No bills found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => {
                  let clientName = "Unknown Client";
                  if (bill.client && typeof bill.client !== "string") {
                    clientName = bill.client.companyName || bill.client.name || "Unknown Client";
                  }

                  const displayTitle = bill.category || bill.description || "N/A";
                  const isSummarized = bill.status === "Summarized";

                  return (
                    <TableRow 
                      key={bill._id} 
                      className="group hover:bg-orange-50/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/bills/${bill._id}`)}
                    >
                      <TableCell className="font-bold text-slate-900 pl-6">
                        {bill.billNumber || `#${bill._id.slice(-5).toUpperCase()}`}
                      </TableCell>
                      
                      <TableCell className="text-slate-600 font-medium">
                        {bill.date 
                          ? new Date(bill.date).toLocaleDateString("en-PK", { day: '2-digit', month: 'short', year: 'numeric' }) 
                          : "—"}
                      </TableCell>
                      
                      <TableCell className="font-bold text-slate-700">
                        {clientName}
                      </TableCell>
                      
                      <TableCell className="text-slate-500 font-medium hidden md:table-cell">
                        <span className="line-clamp-1 max-w-62.5" title={displayTitle}>
                          {displayTitle}
                        </span>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Badge 
                          variant="outline" 
                          className={`font-semibold border ${
                            isSummarized 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          } transition-colors`}
                        >
                          {isSummarized ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Summarized</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" /> Unbilled</>
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-black text-slate-900">
                        Rs {getBaseAmount(bill).toLocaleString("en-PK")}
                      </TableCell>
                      
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-[#ea580c] hover:bg-orange-50 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/bills/${bill._id}`);
                            }}
                            title="Open Bill"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            onClick={(e) => handleDelete(bill._id, e)}
                            title="Delete Bill"
                            disabled={isDeleting === bill._id}
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
      </Card>
    </div>
  );
}
