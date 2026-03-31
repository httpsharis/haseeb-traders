"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ReceiptText,
  FileStack,
  Printer,
  Pencil,
  Clock,
  Trophy,
  Users,
  ArrowRight,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  _id?: string;
  id?: string;
  type?: "Bill" | "Summary";
  amount?: number;
  date?: string;
  status?: string;
  clientName?: string;
  summaryNumber?: string;
  billNumber?: string;
  invoiceNumber?: string;
  client?: string | { _id?: string; name?: string; companyName?: string };
  quantity?: number;
  unitPrice?: number;
  netPayable?: number;
  totalAmount?: number;
  grandTotal?: number;
  baseAmount?: number;
  itemGstAmount?: number;
  taxAmount?: number;
  taxes?: { percentage?: number }[];
}

interface TopClient {
  name: string;
  total: number;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0 }).format(
    amount,
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

export function DashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBills: 0,
    pendingBills: 0,
    totalSummaries: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((res) => res.json().catch(() => ({}))),
      fetch("/api/dashboard/recent?limit=20").then((res) =>
        res.json().catch(() => ({})),
      ),
    ])
      .then(([statsData, recentData]) => {
        const rawBills: ActivityItem[] =
          recentData.bills || recentData.data?.bills || [];
        const rawSummaries: ActivityItem[] =
          recentData.summaries || recentData.data?.summaries || [];

        // 1. Stitch Bills Together (Now includes GST calculation)
        const stitchedBills = rawBills.reduce(
          (acc: ActivityItem[], current: ActivityItem) => {
            const identifier =
              current.summaryNumber ||
              current.billNumber ||
              (current.clientName || "") + (current.date || "");
            const existing = acc.find(
              (b: ActivityItem) =>
                (b.summaryNumber ||
                  b.billNumber ||
                  (b.clientName || "") + (b.date || "")) === identifier,
            );

            // Calculate Base + Tax
            const itemBase =
              current.amount ||
              (current.quantity || 0) * (current.unitPrice || 0) ||
              0;
            let itemTax = current.itemGstAmount || current.taxAmount || 0;

            if (current.taxes && Array.isArray(current.taxes)) {
              current.taxes.forEach((t) => {
                itemTax += (itemBase * (t.percentage || 0)) / 100;
              });
            }

            const currentTotal =
              current.netPayable ||
              current.grandTotal ||
              current.totalAmount ||
              itemBase + itemTax;

            if (existing) {
              existing.amount = (existing.amount || 0) + currentTotal;
            } else {
              acc.push({ ...current, type: "Bill", amount: currentTotal });
            }
            return acc;
          },
          [],
        );

        // 2. Tag Summaries (Now includes GST calculation)
        const processedSummaries = rawSummaries.map((s: ActivityItem) => {
          const base = s.amount || s.baseAmount || 0;
          const tax = s.itemGstAmount || s.taxAmount || 0;
          const finalTotal =
            s.netPayable || s.grandTotal || s.totalAmount || base + tax;

          return { ...s, type: "Summary" as const, amount: finalTotal };
        });

        const allActivity = [...stitchedBills, ...processedSummaries];

        // 3. Calculate Top Clients
        const clientMap = allActivity.reduce(
          (acc: Record<string, number>, doc: ActivityItem) => {
            const name =
              doc.clientName ||
              (typeof doc.client === "object"
                ? doc.client?.name || doc.client?.companyName
                : doc.client) ||
              "Unknown";
            if (name !== "Unknown")
              acc[name] = (acc[name] || 0) + (doc.amount || 0);
            return acc;
          },
          {},
        );

        const sortedTopClients = Object.keys(clientMap)
          .map((name) => ({ name, total: clientMap[name] }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        // 4. Sort Activity
        const combined = allActivity
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 8);

        setStats({
          totalBills: statsData.totalBills || stitchedBills.length,
          pendingBills:
            statsData.pendingBills ||
            allActivity.filter(
              (b: ActivityItem) =>
                b.status === "Draft" || b.status === "Pending" || !b.status,
            ).length,
          totalSummaries:
            statsData.totalSummaries ||
            allActivity.filter((b: ActivityItem) => b.status === "Converted")
              .length,
        });
        setTopClients(sortedTopClients);
        setRecentActivity(combined);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-350 mx-auto pt-8 space-y-8 px-4 sm:px-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Welcome back! Here is your business overview.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/bills/new")}
          className="bg-[#ea580c] hover:bg-[#d44d0a] text-white font-bold h-11 px-6 shadow-md shadow-orange-500/20 rounded-lg transition-all"
        >
          <Plus className="mr-2 h-5 w-5" /> Create Bill
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-slate-300 transition-colors">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
            <ReceiptText className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Bills
            </p>
            <h2 className="text-3xl font-black text-slate-900">
              {stats.totalBills}
            </h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-slate-300 transition-colors">
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-[#ea580c]">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pending Bills
            </p>
            <h2 className="text-3xl font-black text-slate-900">
              {stats.pendingBills}
            </h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-slate-300 transition-colors">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
            <FileStack className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Summaries
            </p>
            <h2 className="text-3xl font-black text-slate-900">
              {stats.totalSummaries}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-lg mb-4">
            Recent Activity
          </h3>

          {loading ? (
            <p className="text-center text-slate-400 py-12">Loading data...</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-center text-slate-400 py-12">
              No recent activity found.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {recentActivity.map((doc, i) => {
                const clientName =
                  doc.clientName ||
                  (typeof doc.client === "object"
                    ? doc.client?.name || doc.client?.companyName
                    : doc.client) ||
                  "Unknown";
                const docNumber =
                  doc.summaryNumber ||
                  doc.billNumber ||
                  doc.invoiceNumber ||
                  "N/A";
                const amount = doc.amount || 0; // The total is already calculated!
                const docId = doc._id || doc.id;

                // Flow Logic: It is ONLY a summary if the status is explicitly "Converted".
                const isConverted = doc.status === "Converted";
                const displayType = isConverted ? "Summary" : "Pending Bill";
                const badgeColor = isConverted
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-[#ea580c]";

                return (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-full ${badgeColor} bg-opacity-20`}
                      >
                        {isConverted ? (
                          <FileStack className="h-6 w-6" />
                        ) : (
                          <Clock className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {clientName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                          <span>{docNumber}</span>
                          <span>•</span>
                          <span>{formatDate(doc.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-4 sm:mt-0">
                      <div className="text-left sm:text-right">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${badgeColor}`}
                        >
                          {displayType}
                        </span>
                        <p className="font-black text-slate-900 text-lg mt-1">
                          Rs {formatMoney(amount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!docId}
                          onClick={() =>
                            router.push(`/dashboard/bills/${docId}`)
                          }
                          className="flex-1 sm:flex-none text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold"
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.print()}
                          className="flex-1 sm:flex-none text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold"
                        >
                          <Printer className="h-4 w-4 mr-2" /> Print
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-slate-800">Top Clients</h3>
              </div>
            </div>

            <div className="p-2">
              {loading ? (
                <p className="text-center text-sm text-slate-400 py-8">
                  Calculating...
                </p>
              ) : topClients.length === 0 ? (
                <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                  <Users className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No client data yet.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {topClients.map((client, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-3 px-4 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xs font-bold text-slate-400 w-4">
                          {idx + 1}
                        </span>
                        <p
                          className="text-sm font-bold text-slate-700 truncate"
                          title={client.name}
                        >
                          {client.name}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 whitespace-nowrap ml-4">
                        Rs {formatMoney(client.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Button
                variant="ghost"
                className="w-full text-slate-600 font-bold hover:bg-white hover:text-slate-900"
                onClick={() => router.push("/dashboard/clients")}
              >
                View All Clients <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-400" />
                Quick Actions
              </h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50/50">
              <Button
                variant="outline"
                className="h-11 bg-white border-slate-200 text-slate-700 hover:border-slate-300 font-bold shadow-sm"
                onClick={() => router.push("/dashboard/clients")}
              >
                <Users className="mr-2 h-4 w-4 text-slate-400" /> Clients
              </Button>
              <Button
                variant="outline"
                className="h-11 bg-white border-slate-200 text-slate-700 hover:border-slate-300 font-bold shadow-sm"
                onClick={() => router.push("/dashboard/settings")}
              >
                <ReceiptText className="mr-2 h-4 w-4 text-slate-400" /> Tax
                Rules
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
