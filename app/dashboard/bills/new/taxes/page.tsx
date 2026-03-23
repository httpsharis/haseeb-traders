"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Percent, Eye, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StepIndicator, useWizard } from "@/components/bills";

// Helper to format money
function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Pre-defined taxes based on your design
const PRESET_TAXES = [
  { id: "gst", label: "GST (18%)", rate: 18 },
  { id: "it", label: "IT (Income Tax)", rate: 4.5 },
  { id: "pst", label: "PST", rate: 5 },
  { id: "sc", label: "S.C", rate: 2 },
  { id: "pst_adc", label: "PST ADC", rate: 1 },
];

export default function TaxesAndReviewPage() {
  const router = useRouter();
  const { data } = useWizard();

  // Redirect if no items
  useEffect(() => {
    if (!data.clientId || data.items.length === 0) {
      router.push("/dashboard/bills/new");
    }
  }, [data.clientId, data.items.length, router]);

  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // State for active taxes and their custom base amounts
  const [activeTaxes, setActiveTaxes] = useState<string[]>(["gst"]); // GST on by default
  const [baseAmounts, setBaseAmounts] = useState<Record<string, number>>({
    gst: subtotal
  });

  // Handle clicking a tax toggle button
  const toggleTax = (taxId: string) => {
    setActiveTaxes((prev) => {
      if (prev.includes(taxId)) {
        return prev.filter(id => id !== taxId);
      } else {
        // When turning on, set its base amount to the subtotal by default
        setBaseAmounts(bases => ({ ...bases, [taxId]: subtotal }));
        return [...prev, taxId];
      }
    });
  };

  // Handle manually typing a new base amount for a specific tax
  const handleBaseAmountChange = (taxId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBaseAmounts(prev => ({ ...prev, [taxId]: numValue }));
  };

  // Calculate final tax values
  const calculatedTaxes = activeTaxes.map(taxId => {
    const taxInfo = PRESET_TAXES.find(t => t.id === taxId);
    const baseAmount = baseAmounts[taxId] || 0;
    const taxValue = baseAmount * ((taxInfo?.rate || 0) / 100);
    return { ...taxInfo, baseAmount, taxValue };
  });

  const totalTaxAmount = calculatedTaxes.reduce((sum, tax) => sum + tax.taxValue, 0);
  const grandTotal = subtotal + totalTaxAmount;

  const handleNext = () => {
    // In a real app, you would save these global taxes to your useWizard context here
    router.push("/dashboard/bills/new/summary");
  };

  if (!data.clientId) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
        <p className="mt-2 text-muted-foreground">Manage tax configurations and review invoice details.</p>
      </div>

      <StepIndicator currentStep={3} />

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Column: Tax Config & Review */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Tax Configuration Panel */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Percent className="size-5 text-[#ea580c]" />
                <CardTitle className="text-lg text-slate-800">Tax Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Toggle Buttons */}
              <div className="flex flex-wrap gap-3">
                {PRESET_TAXES.map((tax) => {
                  const isActive = activeTaxes.includes(tax.id);
                  return (
                    <button
                      key={tax.id}
                      onClick={() => toggleTax(tax.id)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        isActive 
                          ? "border-[#ea580c] bg-orange-50 text-[#ea580c]" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {isActive ? <Check className="size-4" /> : <div className="size-4 rounded-full border border-slate-300" />}
                      {tax.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Base Amount Inputs */}
              {activeTaxes.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  {activeTaxes.map(taxId => {
                    const tax = PRESET_TAXES.find(t => t.id === taxId);
                    return (
                      <div key={`input-${taxId}`} className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">{tax?.label} Base Amount (PKR)</label>
                        <Input 
                          type="number" 
                          value={baseAmounts[taxId] || ""} 
                          onChange={(e) => handleBaseAmountChange(taxId, e.target.value)}
                          className="h-11 bg-slate-50/50"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

            </CardContent>
          </Card>

          {/* Invoice Review Panel */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="size-5 text-[#ea580c]" />
                <CardTitle className="text-lg text-slate-800">Invoice Review</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              {/* Client & Info Split */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Client Details</h3>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="font-bold text-slate-900">{data.clientName}</p>
                    <p className="text-sm text-slate-500 mt-1">Summary #: {data.summaryNumber}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Invoice Information</h3>
                  <div className="rounded-lg bg-slate-50 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax Period:</span>
                      <span className="font-medium text-slate-900">{data.taxPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issue Date:</span>
                      <span className="font-medium text-slate-900">{data.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Line Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatMoney(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-bold text-slate-700">{formatMoney(item.quantity * item.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Column: Settlement Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6 border-slate-200 shadow-md">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <CardTitle className="text-lg">Settlement Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-bold text-slate-900">{formatMoney(subtotal)}</span>
                </div>
                
                {calculatedTaxes.map((tax, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-600">{tax.label}</span>
                    <span className="font-medium text-slate-900">{formatMoney(tax.taxValue)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-end justify-between border-t pt-4">
                <span className="text-lg font-bold text-slate-800">Grand Total</span>
                <span className="text-2xl font-bold text-[#ea580c]">
                  PKR {formatMoney(grandTotal)}
                </span>
              </div>

              <div className="space-y-3 pt-4">
                <Button onClick={handleNext} className="h-12 w-full bg-[#ea580c] text-md hover:bg-[#ea580c]/90">
                  Continue to Finalize <ArrowRight className="ml-2 size-4" />
                </Button>
                
                <Button variant="outline" onClick={() => router.push("/dashboard/bills/new/items")} className="h-12 w-full border-slate-300 text-slate-700">
                  Back to Items
                </Button>
              </div>

            </CardContent>
          </Card>

          <div className="rounded-lg bg-orange-50/50 border border-orange-100 p-4 flex gap-3 text-xs text-orange-800">
            <Info className="size-4 shrink-0 mt-0.5 text-[#ea580c]" />
            <p>Tax calculations are based on the selected toggles. Review base amounts if manual adjustments are required.</p>
          </div>

        </div>

      </div>
    </div>
  );
}