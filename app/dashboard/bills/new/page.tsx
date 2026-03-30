"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StepIndicator, useWizard } from "@/components/bills";
import { ClientSelector } from "@/components/bills/clientPage/clientSelector";
import { BillDetailsForm } from "@/components/bills/clientPage/clientDetailsForm";
import { WizardFooter } from "@/components/bills/nevigationButtons";

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const { data, setClientInfo } = useWizard();

  const [clientId, setClientId] = useState(data.clientId);
  const [clientName, setClientName] = useState(data.clientName);
  const [summaryNumber, setSummaryNumber] = useState(data.summaryNumber);
  const [date, setDate] = useState(data.date);
  const [taxPeriod, setTaxPeriod] = useState(data.taxPeriod);

  const isFormValid = clientId && summaryNumber && date && taxPeriod;

  const handleNext = () => {
    setClientInfo(clientId, clientName, summaryNumber, taxPeriod, date);
    router.push("/dashboard/bills/new/items");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-3xl mx-auto pt-8 space-y-8 px-4 sm:px-0">

        {/* Cleaner Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Add Client Information</h1>
          <p className="text-slate-500 font-medium">Step 1: Provide client details</p>
        </div>

        <StepIndicator currentStep={1} />

        {/* Premium Card Container */}
        <Card className="shadow-xl shadow-slate-200/40 border-slate-100 rounded-2xl bg-white overflow-hidden">
          <div className="p-8 sm:p-10 space-y-10">

            <ClientSelector
              selectedName={clientName}
              onSelect={(id, name) => {
                setClientId(id);
                setClientName(name);
              }}
            />

            <BillDetailsForm
              clientName={clientName}
              summaryNumber={summaryNumber} setSummaryNumber={setSummaryNumber}
              date={date} setDate={setDate}
              taxPeriod={taxPeriod} setTaxPeriod={setTaxPeriod}
            />

          </div>
        </Card>

        <WizardFooter
          onNext={handleNext}
          isNextDisabled={!isFormValid}
          nextLabel="Next: Item Details"
        />

      </div>
    </div>
  );
}