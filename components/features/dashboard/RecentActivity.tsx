"use client";

import { useRouter } from "next/navigation";
import { FileStack, Clock, Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhantomLoader } from "@/components/ui/PhantomLoader";

import type { ActivityItem } from "@/types";

export function RecentActivity({
  data,
  loading,
}: {
  data: ActivityItem[];
  loading: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">
          Recent Activity
        </h3>
        <PhantomLoader loading={true} animation="shimmer">
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-22 w-full bg-white border border-slate-200 rounded-xl"
              ></div>
            ))}
          </div>
        </PhantomLoader>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">
          Recent Activity
        </h3>
        <div className="text-center bg-white border border-slate-200 rounded-xl py-12">
          <p className="text-sm font-medium text-slate-500">
            No recent activity found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">
        Recent Activity
      </h3>
      <div className="flex flex-col gap-3">
        {data.map((doc, i) => {
          const clientName =
            doc.clientName ||
            (typeof doc.client === "object" ? doc.client?.name : doc.client) ||
            "Unknown";
          const docNumber =
            doc.summaryNumber || doc.billNumber || doc.invoiceNumber || "N/A";
          const amount = doc.amount || 0;
          const docId = doc._id || doc.id;
          const isConverted = doc.status === "Converted";
          const displayType = isConverted ? "Summary" : "Pending Bill";
          const badgeColor = isConverted
            ? "bg-slate-100 text-slate-700"
            : "bg-orange-50 text-[#ea580c]";

          return (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${badgeColor}`}>
                  {isConverted ? (
                    <FileStack className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {clientName}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mt-0.5">
                    <span>{docNumber}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-3 sm:mt-0">
                <div className="text-left sm:text-right">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-widest ${badgeColor}`}
                  >
                    {displayType}
                  </span>
                  <p className="font-black text-slate-900 text-base mt-0.5">
                    Rs {amount.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!docId}
                    onClick={() => router.push(`/dashboard/bills/${docId}`)}
                    className="h-8 text-xs font-bold text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Pencil className="h-3 w-3 mr-1.5" /> Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs font-bold text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Printer className="h-3 w-3 mr-1.5" /> Print
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
