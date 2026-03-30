"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StepIndicator, useWizard } from "@/components/bills";
import { LineItemsTable } from "@/components/bills/itemsPage/lineItemsTable";
import { LiveDraftSidebar } from "@/components/bills/itemsPage/liveDraftSidebar";
import { PrintLayout } from "@/components/bills/itemsPage/printLayout";

export default function ItemDetailsPage() {
  const router = useRouter();
  const { data } = useWizard();

  // Redirect if they skipped Step 1
  useEffect(() => {
    if (!data.clientId) {
      router.push("/dashboard/bills/new");
    }
  }, [data.clientId, router]);

  if (!data.clientId) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-6xl mx-auto pt-8 space-y-8 px-4 sm:px-0 print:m-0 print:p-0">

        {/* Header Section */}
        <div className="print:hidden space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Invoice</h1>
            <p className="text-slate-500 font-medium">Step 2: Draft Line Items</p>
          </div>

          <StepIndicator currentStep={2} />

          {/* Back Button moved right under progress bar */}
          <div className="flex justify-center mt-2">
            <button
              onClick={() => router.push("/dashboard/bills/new")}
              className="flex items-center text-sm font-semibold text-slate-400 hover:text-[#ea580c] transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Client Details
            </button>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm bg-white border border-slate-200 px-6 py-4 rounded-xl text-slate-600 shadow-sm justify-center">
            <div><span className="font-semibold text-slate-400 uppercase tracking-wider text-xs mr-2">Client</span> <span className="font-bold text-slate-900">{data.clientName}</span></div>
            <div><span className="font-semibold text-slate-400 uppercase tracking-wider text-xs mr-2">Bill #</span> <span className="font-bold text-slate-900">{data.summaryNumber}</span></div>
            <div><span className="font-semibold text-slate-400 uppercase tracking-wider text-xs mr-2">Period</span> <span className="font-bold text-slate-900">{data.taxPeriod}</span></div>
          </div>
        </div>

        {/* Main Application Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full">

          {/* Left Column (Forms) */}
          <div className="lg:col-span-8 space-y-6 print:hidden">
            {/* The table we built earlier goes here! */}
            <LineItemsTable />
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-4 print:hidden">
            {/* We will build this next! */}
            <LiveDraftSidebar />
          </div>

          {/* Print Layout */}
          <div className="hidden print:block print:col-span-12 print:w-full print:m-0 print:p-0">
            {/* We will build this last! */}
            <PrintLayout data={data} />
          </div>

        </div>
      </div>
    </div>
  );
}