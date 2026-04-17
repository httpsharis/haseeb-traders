"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ReceiptText, Clock, FileStack, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhantomLoader } from "@/components/ui/PhantomLoader";

import { RecentActivity } from "@/components/features/dashboard/RecentActivity";
import { TopClients } from "@/components/features/dashboard/TopClient";
import type { ActivityItem, TopClient } from "@/types";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBills: 0,
    pendingBills: 0,
    totalSummaries: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);

  // The Data Brain: Fetches and calculates everything
  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then((res) => res.json().catch(() => ({}))),
      fetch("/api/dashboard/recent?limit=20").then((res) =>
        res.json().catch(() => ({})),
      ),
    ])
      .then(([statsData, recentData]) => {
        const rawBills: ActivityItem[] = recentData.bills || recentData.data?.bills || [];
        const rawSummaries: ActivityItem[] = recentData.summaries || recentData.data?.summaries || [];

        const stitchedBills = rawBills.reduce((acc: ActivityItem[], current: ActivityItem) => {
          const identifier = current.summaryNumber || current.billNumber || (current.clientName || "") + (current.date || "");
          const existing = acc.find(
            (b: ActivityItem) => (b.summaryNumber || b.billNumber || (b.clientName || "") + (b.date || "")) === identifier
          );

          const itemBase = current.amount || (current.quantity || 0) * (current.unitPrice || 0) || 0;
          let itemTax = current.itemGstAmount || current.taxAmount || 0;

          if (current.taxes && Array.isArray(current.taxes)) {
            current.taxes.forEach((t) => { itemTax += (itemBase * (t.percentage || 0)) / 100; });
          }

          const currentTotal = current.netPayable || current.grandTotal || current.totalAmount || itemBase + itemTax;

          if (existing) {
            existing.amount = (existing.amount || 0) + currentTotal;
          } else {
            acc.push({ ...current, type: "Bill", amount: currentTotal });
          }
          return acc;
        }, []);

        const processedSummaries = rawSummaries.map((s: ActivityItem) => {
          const base = s.amount || s.baseAmount || 0;
          const tax = s.itemGstAmount || s.taxAmount || 0;
          const finalTotal = s.netPayable || s.grandTotal || s.totalAmount || base + tax;
          return { ...s, type: "Summary" as const, amount: finalTotal };
        });

        const allActivity = [...stitchedBills, ...processedSummaries];

        const clientMap = allActivity.reduce((acc: Record<string, number>, doc: ActivityItem) => {
          const name = doc.clientName || (typeof doc.client === "object" ? doc.client?.name || doc.client?.companyName : doc.client) || "Unknown";
          if (name !== "Unknown") acc[name] = (acc[name] || 0) + (doc.amount || 0);
          return acc;
        }, {});

        const sortedTopClients = Object.keys(clientMap)
          .map((name) => ({ name, total: clientMap[name] }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        const combined = allActivity
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 8);

        setStats({
          totalBills: statsData.totalBills || stitchedBills.length,
          pendingBills: statsData.pendingBills || allActivity.filter((b: ActivityItem) => b.status === "Draft" || b.status === "Pending" || !b.status).length,
          totalSummaries: statsData.totalSummaries || allActivity.filter((b: ActivityItem) => b.status === "Converted").length,
        });

        setTopClients(sortedTopClients);
        setRecentActivity(combined);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Look how clean the UI is now!
  return (
    <div className="max-w-350 mx-auto pt-6 space-y-6 px-6 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Welcome back! Here is your business overview.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/bills/new?fresh=true")}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-5 rounded-lg transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Bill
        </Button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PhantomLoader loading={loading}>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-lg text-slate-900">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Bills</p>
              <h2 className="text-2xl font-black text-slate-900">{stats.totalBills}</h2>
            </div>
          </div>
        </PhantomLoader>

        <PhantomLoader loading={loading}>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg text-[#ea580c]">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending Bills</p>
              <h2 className="text-2xl font-black text-slate-900">{stats.pendingBills}</h2>
            </div>
          </div>
        </PhantomLoader>

        <PhantomLoader loading={loading}>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-lg text-slate-900">
              <FileStack className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Summaries</p>
              <h2 className="text-2xl font-black text-slate-900">{stats.totalSummaries}</h2>
            </div>
          </div>
        </PhantomLoader>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity data={recentActivity} loading={loading} />
        </div>

        {/* Right Side: Top Clients & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <TopClients data={topClients} loading={loading} />

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-400" /> Actions
              </h3>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2 bg-slate-50">
              <Button variant="outline" size="sm" className="bg-white font-bold text-xs hover:border-[#ea580c]/50 hover:text-[#ea580c]" onClick={() => router.push("/dashboard/clients")}>
                <Users className="mr-2 h-3 w-3" /> Clients
              </Button>
              <Button variant="outline" size="sm" className="bg-white font-bold text-xs hover:border-[#ea580c]/50 hover:text-[#ea580c]" onClick={() => router.push("/dashboard/settings")}>
                <ReceiptText className="mr-2 h-3 w-3" /> Tax Rules
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}