"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ReceiptText, FileStack, Printer, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(dateString));
}

export function DashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalBills: 0, totalSummaries: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then(res => res.json().catch(() => ({}))),
      fetch("/api/dashboard/recent?limit=10").then(res => res.json().catch(() => ({})))
    ]).then(([statsData, recentData]) => {
      setStats(statsData || { totalBills: 0, totalSummaries: 0 });

      const rawSummaries = recentData.summaries || recentData.data?.summaries || [];
      setRecentActivity(rawSummaries);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto pt-8 space-y-8 px-4 sm:px-0 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Welcome back! Here is your business overview.</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/bills/new")}
          className="bg-[#ea580c] hover:bg-[#d44d0a] text-white font-bold h-11 px-6 shadow-md shadow-orange-500/20 rounded-lg transition-all"
        >
          <Plus className="mr-2 h-5 w-5" /> Create Invoice
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-orange-200 transition-colors">
          <div className="p-4 bg-orange-50 rounded-xl text-[#ea580c]">
            <ReceiptText className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Bills</p>
            <h2 className="text-3xl font-black text-slate-900">{stats.totalBills || 0}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-colors">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <FileStack className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Summaries</p>
            <h2 className="text-3xl font-black text-slate-900">{stats.totalSummaries || 0}</h2>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Recent Activity</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Doc #</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">Loading data...</td>
                </tr>
              ) : recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No recent activity found.</td>
                </tr>
              ) : (
                recentActivity.map((doc, i) => {

                  const clientName = doc.clientName || doc.client?.name || "Unknown";
                  const docNumber = doc.summaryNumber || doc.billNumber || `INV-${i + 1}`;
                  const amount = doc.totalAmount || doc.amount || 0;

                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-slate-500">
                        {formatDate(doc.date || doc.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900">
                        {clientName}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-600">
                        {docNumber}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900 text-right">
                        Rs {formatMoney(amount)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/bills/${doc._id || doc.id}`)}
                            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-semibold transition-colors"
                          >
                            <Pencil className="h-4 w-4 mr-1.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.print()}
                            className="text-slate-500 hover:text-[#ea580c] hover:bg-orange-50 font-semibold transition-colors"
                          >
                            <Printer className="h-4 w-4 mr-1.5" /> Print
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}