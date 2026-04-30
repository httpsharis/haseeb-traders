import { Button } from "@/components/ui/button";
import { Clock, FileStack, ReceiptText, Settings, Users } from "lucide-react";
import Link from "next/link";

import { RecentActivity } from "@/components/features/dashboard/RecentActivity";
import { TopClients } from "@/components/features/dashboard/TopClient";
import type { ActivityItem, TopClient } from "@/types";

import { CreateBillActionBuilder } from "@/components/features/bills/CreateBillActionBuilder";
import { connectDB } from "@/config/db";
import { getDashboardStatsService, getRecentActivityService } from "@/services/billService";

interface DBId {
  toString: () => string;
}

interface RawBillRecord {
  toObject?: () => RawBillRecord;
  _id?: DBId;
  summary?: DBId;
  client?: {
    _id?: DBId;
    name?: string;
    companyName?: string;
  };
  [key: string]: unknown;
}

interface RawSummaryRecord {
  toObject?: () => RawSummaryRecord;
  _id?: DBId;
  client?: DBId;
  bills?: DBId[];
  [key: string]: unknown;
}

export default async function Dashboard() {
  await connectDB();

  const [statsData, recentData] = await Promise.all([
    getDashboardStatsService(),
    getRecentActivityService(20)
  ]);

  const rawBills: ActivityItem[] = recentData.bills.map((b: RawBillRecord) => {
    const obj = b.toObject ? b.toObject() : { ...b };
    obj.clientName = obj.client?.name || "";
    if (obj._id) obj._id = obj._id.toString();
    if (obj.summary) obj.summary = obj.summary.toString();
    if (obj.client && obj.client._id) obj.client._id = obj.client._id.toString();
    return obj as ActivityItem;
  });

  const rawSummaries: ActivityItem[] = recentData.summaries.map((s: RawSummaryRecord) => {
    const obj = s.toObject ? s.toObject() : { ...s };
    if (obj._id) obj._id = obj._id.toString();
    if (obj.client) obj.client = obj.client.toString();
    if (obj.bills && Array.isArray(obj.bills)) {
      obj.bills = obj.bills.map((bId: DBId) => bId.toString());
    }
    return obj as ActivityItem;
  });

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

  const topClients: TopClient[] = Object.keys(clientMap)
    .map((name) => ({ name, total: clientMap[name] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const combinedActivity = allActivity
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 8);

  const stats = {
    totalBills: statsData.totalBills,
    pendingAmount: statsData.pendingAmount || 0,
    totalSummaries: statsData.totalSummaries,
  };

  // Objects are plain JS objects now due to .lean() and aggregate()
const safeCombinedActivity = JSON.parse(JSON.stringify(combinedActivity));
  const safeTopClients = topClients;

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
        <CreateBillActionBuilder />
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-900">
            <ReceiptText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Bills</p>
            <h2 className="text-2xl font-black text-slate-900">{stats.totalBills}</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-lg text-[#ea580c]">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pending Amount</p>
            <h2 className="text-2xl font-black text-slate-900">${stats.pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-900">
            <FileStack className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Summaries</p>
            <h2 className="text-2xl font-black text-slate-900">{stats.totalSummaries}</h2>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity data={safeCombinedActivity} loading={false} />
        </div>

        {/* Right Side: Top Clients & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <TopClients data={safeTopClients} loading={false} />

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-400" /> Actions
              </h3>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2 bg-slate-50">
              <Button asChild variant="outline" size="sm" className="bg-white font-bold text-xs hover:border-[#ea580c]/50 hover:text-[#ea580c]">
                <Link href="/dashboard/clients">
                  <Users className="mr-2 h-3 w-3" /> Clients
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-white font-bold text-xs hover:border-[#ea580c]/50 hover:text-[#ea580c]">
                <Link href="/dashboard/settings">
                  <ReceiptText className="mr-2 h-3 w-3" /> Tax Rules
                </Link>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}