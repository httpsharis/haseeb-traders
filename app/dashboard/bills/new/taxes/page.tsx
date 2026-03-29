"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Percent, Eye, Info, Check, PenLine } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { StepIndicator, useWizard } from "@/components/bills";

// Helper to format money
function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface TaxRule {
  _id: string;
  name: string;
  percentage: number;
  isActive: boolean;
}

export default function TaxesAndReviewPage() {
  const router = useRouter();
  const { data, applyTaxesToItems } = useWizard();

  // Redirect if no items
  useEffect(() => {
    if (!data.clientId || data.items.length === 0) {
      router.push("/dashboard/bills/new");
    }
  }, [data.clientId, data.items.length, router]);

  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Fetch tax rules from API
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [taxLoading, setTaxLoading] = useState(true);

  // State for active taxes, their custom base amounts, and manual amount overrides
  const [activeTaxes, setActiveTaxes] = useState<string[]>([]);
  const [baseAmounts, setBaseAmounts] = useState<Record<string, number>>({});
  const [manualAmounts, setManualAmounts] = useState<Record<string, number | null>>({});
  const [useManual, setUseManual] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/tax-types")
      .then((res) => res.json())
      .then((fetchedData) => {
        const active = (Array.isArray(fetchedData) ? fetchedData : []).filter((t: TaxRule) => t.isActive);
        setTaxRules(active);

        // If wizard already has summaryTaxes (user came back), restore them
        if (data.summaryTaxes && data.summaryTaxes.length > 0) {
          const restoredActive: string[] = [];
          const restoredBases: Record<string, number> = {};
          const restoredManual: Record<string, number | null> = {};
          const restoredUseManual: Record<string, boolean> = {};

          data.summaryTaxes.forEach((tax) => {
            const matchingRule = active.find((r: TaxRule) => r.name === tax.name);
            if (matchingRule) {
              restoredActive.push(matchingRule._id);
              restoredBases[matchingRule._id] = tax.baseAmount;
              // Check if the amount differs from computed — means user had manual override
              const computedAmount = tax.baseAmount * (tax.percentage / 100);
              if (Math.abs(tax.amount - computedAmount) > 0.01) {
                restoredManual[matchingRule._id] = tax.amount;
                restoredUseManual[matchingRule._id] = true;
              } else {
                restoredManual[matchingRule._id] = null;
                restoredUseManual[matchingRule._id] = false;
              }
            }
          });

          setActiveTaxes(restoredActive);
          setBaseAmounts(restoredBases);
          setManualAmounts(restoredManual);
          setUseManual(restoredUseManual);
        } else if (active.length > 0) {
          // Auto-enable the first tax rule (usually GST) with subtotal as base
          setActiveTaxes([active[0]._id]);
          setBaseAmounts({ [active[0]._id]: subtotal });
        }
      })
      .catch(() => console.error("Failed to load tax rules"))
      .finally(() => setTaxLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle clicking a tax toggle button
  const toggleTax = (taxId: string) => {
    setActiveTaxes((prev) => {
      if (prev.includes(taxId)) {
        return prev.filter(id => id !== taxId);
      } else {
        setBaseAmounts(bases => ({ ...bases, [taxId]: subtotal }));
        setManualAmounts(prev => ({ ...prev, [taxId]: null }));
        setUseManual(prev => ({ ...prev, [taxId]: false }));
        return [...prev, taxId];
      }
    });
  };

  // Handle manually typing a new base amount for a specific tax
  const handleBaseAmountChange = (taxId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBaseAmounts(prev => ({ ...prev, [taxId]: numValue }));
  };

  // Handle manual tax amount override
  const handleManualAmountChange = (taxId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setManualAmounts(prev => ({ ...prev, [taxId]: numValue }));
  };

  // Toggle between auto-calculated and manual mode
  const toggleManualMode = (taxId: string) => {
    setUseManual(prev => {
      const newMode = !prev[taxId];
      if (newMode) {
        // Switch to manual: pre-fill with current computed value
        const taxInfo = taxRules.find(t => t._id === taxId);
        const baseAmount = baseAmounts[taxId] || 0;
        const computedValue = baseAmount * ((taxInfo?.percentage || 0) / 100);
        setManualAmounts(ma => ({ ...ma, [taxId]: computedValue }));
      }
      return { ...prev, [taxId]: newMode };
    });
  };

  // Calculate final tax values
  const calculatedTaxes = activeTaxes.map(taxId => {
    const taxInfo = taxRules.find(t => t._id === taxId);
    const baseAmount = baseAmounts[taxId] || 0;
    const computedValue = baseAmount * ((taxInfo?.percentage || 0) / 100);
    const isManual = useManual[taxId] || false;
    const taxValue = isManual && manualAmounts[taxId] !== null ? manualAmounts[taxId]! : computedValue;
    return {
      id: taxId,
      label: taxInfo ? `${taxInfo.name} (${taxInfo.percentage}%)` : "",
      name: taxInfo?.name || "",
      rate: taxInfo?.percentage || 0,
      baseAmount,
      taxValue,
      isManual,
    };
  });

  const totalTaxAmount = calculatedTaxes.reduce((sum, tax) => sum + tax.taxValue, 0);
  const grandTotal = subtotal + totalTaxAmount;

  const handleNext = () => {
    // Persist taxes to wizard context before navigating
    const taxCharges = calculatedTaxes.map(tax => ({
      name: tax.name,
      percentage: tax.rate,
      baseAmount: tax.baseAmount,
      amount: tax.taxValue,
    }));
    applyTaxesToItems(taxCharges);
    router.push("/dashboard/bills/new/summary");
  };

  if (!data.clientId) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Bill</h1>
        <p className="mt-2 text-muted-foreground">Manage tax configurations and review bill details.</p>
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
              
              {/* Toggle Buttons — fetched from Tax Rules API */}
              {taxLoading ? (
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-full" />)}
                </div>
              ) : taxRules.length === 0 ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
                  No tax rules configured yet. Add them in <button onClick={() => router.push("/dashboard/tax-rules")} className="underline font-medium">Master Settings → Tax Rules</button>.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {taxRules.map((tax) => {
                    const isActive = activeTaxes.includes(tax._id);
                    return (
                      <button
                        key={tax._id}
                        onClick={() => toggleTax(tax._id)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          isActive 
                            ? "border-[#ea580c] bg-orange-50 text-[#ea580c]" 
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {isActive ? <Check className="size-4" /> : <div className="size-4 rounded-full border border-slate-300" />}
                        {tax.name} ({tax.percentage}%)
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Custom Base Amount + Manual Amount Inputs */}
              {activeTaxes.length > 0 && (
                <div className="space-y-5 pt-4 border-t">
                  {activeTaxes.map(taxId => {
                    const tax = taxRules.find(t => t._id === taxId);
                    const isManual = useManual[taxId] || false;
                    const computedTax = calculatedTaxes.find(t => t.id === taxId);
                    return (
                      <div key={`input-${taxId}`} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-800">{tax?.name} ({tax?.percentage}%)</h4>
                          <button
                            onClick={() => toggleManualMode(taxId)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              isManual
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <PenLine className="size-3" />
                            {isManual ? "Manual Mode" : "Auto Mode"}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Base Amount (PKR)</label>
                            <Input 
                              type="number" 
                              value={baseAmounts[taxId] || ""} 
                              onChange={(e) => handleBaseAmountChange(taxId, e.target.value)}
                              className="h-10 bg-slate-50/50"
                              disabled={isManual}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">
                              {isManual ? "Tax Amount (PKR) — Manual" : "Tax Amount (PKR) — Auto"}
                            </label>
                            {isManual ? (
                              <Input
                                type="number"
                                value={manualAmounts[taxId] ?? ""}
                                onChange={(e) => handleManualAmountChange(taxId, e.target.value)}
                                className="h-10 bg-blue-50/50 border-blue-200 focus-visible:ring-blue-300"
                              />
                            ) : (
                              <div className="h-10 flex items-center px-3 rounded-md bg-slate-100 text-sm font-semibold text-slate-700 border border-slate-200">
                                {formatMoney(computedTax?.taxValue || 0)}
                              </div>
                            )}
                          </div>
                        </div>
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
                    <span className="text-slate-600">
                      {tax.label}
                      {tax.isManual && <span className="ml-1 text-[10px] text-blue-600 font-medium">(manual)</span>}
                    </span>
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
            <p>Tax calculations are based on the selected toggles. Use <strong>Manual Mode</strong> to override computed amounts with custom values.</p>
          </div>

        </div>

      </div>
    </div>
  );
}