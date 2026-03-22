"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizard } from "./WizardContext";
import { calculateItemTotal, calculateItemTaxTotal, calculateGrandTotal } from "./types";

export function LiveCalculator() {
  const { data } = useWizard();
  const { items, discount } = data;

  const baseAmount = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  // Group taxes by name
  const taxTotals: Record<string, number> = {};
  items.forEach((item) => {
    item.taxes.forEach((tax) => {
      taxTotals[tax.name] = (taxTotals[tax.name] || 0) + tax.amount;
    });
  });

  const totalTax = items.reduce((sum, item) => sum + calculateItemTaxTotal(item), 0);
  const grandTotal = calculateGrandTotal(items, discount);

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Settlement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Base Amount" value={baseAmount} />

        {Object.entries(taxTotals).map(([name, amount]) => (
          <Row key={name} label={name} value={amount} />
        ))}

        {discount > 0 && <Row label="Discount" value={-discount} className="text-red-500" />}

        <div className="border-t pt-3 mt-3">
          <Row label="Grand Total" value={grandTotal} className="font-bold text-lg" />
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          {items.length} item{items.length !== 1 ? "s" : ""} added
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <div className={`flex justify-between ${className}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>PKR {value.toLocaleString()}</span>
    </div>
  );
}
