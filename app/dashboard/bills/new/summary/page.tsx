"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StepIndicator, useWizard } from "@/components/bills";
import { InvoicePreview } from "@/components/bills/Invoice Page/invoicePreview";
import { ReviewSidebar } from "@/components/bills/Invoice Page/reviewSidebar";

export default function SummaryPage() {
  const router = useRouter();
  const { data } = useWizard();

  useEffect(() => {
    if (!data.clientId || data.items.length === 0) {
      router.push("/dashboard/bills/new");
    }
  }, [data.clientId, data.items.length, router]);

  if (!data.clientId || data.items.length === 0) return null;

  return (
    <>
      {/* The Magic Print CSS: Hides headers, footers, and forces A4 size */}
      <style type="text/css" media="print">
        {`
                  @page { size: A4 portrait; margin: 0; }
                  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  html, body { height: 100%; }
                `}
      </style>

      <div className="min-h-screen bg-slate-50/50 pb-12 print:bg-white print:pb-0 print:min-h-0">
        <div className="max-w-6xl mx-auto pt-8 space-y-8 px-4 sm:px-0 print:m-0 print:p-0 print:space-y-0">

          {/* Header - Hidden on Print */}
          <div className="print:hidden space-y-6">
            <button
              onClick={() => router.push("/dashboard/bills/new/items")}
              className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Items
            </button>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Review Invoice</h1>
              <p className="text-slate-500 font-medium">Review your invoice details before finalizing and saving.</p>
            </div>

            <StepIndicator currentStep={3} />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full">

            {/* Left Column: The Invoice Preview */}
            <div className="lg:col-span-8 print:col-span-12 print:w-full">
              <InvoicePreview />
            </div>

            {/* Right Column: Actions (Hidden on Print) */}
            <div className="lg:col-span-4 print:hidden">
              <ReviewSidebar />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}