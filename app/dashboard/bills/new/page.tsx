"use client";

import { useState } from "react";
import { WizardProvider, useWizard, StepIndicator } from "@/components/bills";
import { ClientSelector } from "@/components/bills/clientPage/clientSelector";
import { BillDetailsForm } from "@/components/bills/clientPage/clientDetailsForm";
import { LineItemsTable } from "@/components/bills/itemsPage/lineItemsTable";
import { LiveDraftSidebar } from "@/components/bills/itemsPage/liveDraftSidebar";
import { InvoicePreview } from "@/components/bills/Invoice Page/invoicePreview";
import { ReviewSidebar } from "@/components/bills/Invoice Page/reviewSidebar";

/**
 * Inner component that uses the Wizard context
 * Split this way so WizardProvider is available
 */
function CreateBillContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const { data, setClientInfo, reset } = useWizard();

  // STEP 1: Client Details Validation
  const isStep1Valid = () => {
    return data.clientId && data.clientName && data.summaryNumber && data.date && data.taxPeriod;
  };

  // STEP 2: Items Validation
  const isStep2Valid = () => {
    return data.items && data.items.length > 0;
  };

  // Handle Next button logic
  const handleNext = () => {
    if (currentStep === 1) {
      if (!isStep1Valid()) {
        alert("Please complete all client details before proceeding.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!isStep2Valid()) {
        alert("Please add at least one item to the invoice.");
        return;
      }
      setCurrentStep(3);
    }
  };

  // Handle Back button logic
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle Cancel (reset and go back to dashboard)
  const handleCancel = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50 pb-12">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Invoice</h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">Build and review your invoice in simple steps</p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step 1: Client Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-8">Step 1: Client Information</h2>
            
            <div className="space-y-8">
              {/* Client Selector */}
              <ClientSelector
                selectedName={data.clientName}
                onSelect={(id, name) => setClientInfo(id, name, data.summaryNumber, data.taxPeriod, data.date)}
              />

              {/* Bill Details - shown only after client is selected */}
              {data.clientName && (
                <BillDetailsForm
                  clientName={data.clientName}
                  summaryNumber={data.summaryNumber}
                  setSummaryNumber={(val) => setClientInfo(data.clientId, data.clientName, val, data.taxPeriod, data.date)}
                  date={data.date}
                  setDate={(val) => setClientInfo(data.clientId, data.clientName, data.summaryNumber, data.taxPeriod, val)}
                  taxPeriod={data.taxPeriod}
                  setTaxPeriod={(val) => setClientInfo(data.clientId, data.clientName, data.summaryNumber, val, data.date)}
                />
              )}
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 mt-8">
              <button
                onClick={handleCancel}
                className="px-8 h-11 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={!isStep1Valid()}
                className="px-8 h-11 rounded-lg bg-[#ea580c] text-white font-medium hover:bg-[#c2410c] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next <span className="ml-1">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Line Items */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-8">Step 2: Line Items</h2>
                  <LineItemsTable />
                </div>

                {/* Navigation Footer */}
                <div className="flex justify-between gap-4 p-8 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={handleBack}
                    className="px-8 h-11 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-white transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!isStep2Valid()}
                    className="px-8 h-11 rounded-lg bg-[#ea580c] text-white font-medium hover:bg-[#c2410c] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    Review <span className="ml-1">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Draft Sidebar */}
            <div className="lg:col-span-1">
              <LiveDraftSidebar />
            </div>
          </div>
        )}

        {/* Step 3: Review & Finalize */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <InvoicePreview />
            </div>

            {/* Review Sidebar with Submit */}
            <div className="lg:col-span-1">
              <ReviewSidebar />
            </div>
          </div>
        )}

        {/* Bottom Navigation for Step 3 */}
        {currentStep === 3 && (
          <div className="flex justify-between gap-4 mt-8 pt-8 border-t border-slate-200">
            <button
              onClick={handleBack}
              className="px-8 h-11 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Back to Items
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Page Component
 * Wraps content with WizardProvider to supply context to all child components
 */
export default function CreateBillPage() {
  return (
    <WizardProvider>
      <CreateBillContent />
    </WizardProvider>
  );
}