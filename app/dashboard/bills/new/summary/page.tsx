"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StepIndicator,
  useWizard,
  calculateItemTotal,
  calculateItemTaxTotal,
  calculateGrandTotal,
} from "@/components/bills";

export default function SummaryPage() {
  const router = useRouter();
  const { data, reset } = useWizard();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Redirect if no data
  useEffect(() => {
    if (!data.clientId || data.items.length === 0) {
      router.push("/dashboard/bills/new");
    }
  }, [data.clientId, data.items.length, router]);

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalTax = data.items.reduce((sum, item) => sum + calculateItemTaxTotal(item), 0);
  const grandTotal = calculateGrandTotal(data.items, data.discount);

  // Group taxes by name for summary
  const taxSummary: Record<string, number> = {};
  data.items.forEach((item) => {
    item.taxes.forEach((tax) => {
      taxSummary[tax.name] = (taxSummary[tax.name] || 0) + tax.amount;
    });
  });

  // Save to database
  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      // Transform items to bills format
      const bills = data.items.map((item, idx) => ({
        billNumber: item.billNumber || String(idx + 1),
        date: item.date || data.date,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxes: item.taxes,
      }));

      const payload = {
        client: data.clientId,
        summaryNumber: data.summaryNumber,
        date: data.date,
        taxPeriod: data.taxPeriod,
        status: "Draft",
        discount: data.discount,
        commission: data.commission,
        bills,
      };

      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }

    setSaving(false);
  };

  // Export to Excel (CSV format for simplicity)
  const handleExport = () => {
    const rows: string[][] = [];

    // Header info
    rows.push(["Invoice Summary"]);
    rows.push(["Client", data.clientName]);
    rows.push(["Bill #", data.summaryNumber]);
    rows.push(["Date", data.date]);
    rows.push(["Tax Period", data.taxPeriod]);
    rows.push([]);

    // Items header
    rows.push(["#", "Description", "Category", "QTY", "Unit Price", "Amount", "Tax", "Total"]);

    // Items data
    data.items.forEach((item, idx) => {
      const amount = calculateItemTotal(item);
      const tax = calculateItemTaxTotal(item);
      rows.push([
        String(idx + 1),
        item.description,
        item.category,
        String(item.quantity),
        String(item.unitPrice),
        String(amount),
        String(tax),
        String(amount + tax),
      ]);
    });

    rows.push([]);

    // Tax breakdown
    rows.push(["Tax Breakdown"]);
    Object.entries(taxSummary).forEach(([name, amount]) => {
      rows.push([name, String(amount)]);
    });

    rows.push([]);

    // Totals
    rows.push(["Subtotal", String(subtotal)]);
    rows.push(["Total Tax", String(totalTax)]);
    if (data.discount > 0) {
      rows.push(["Discount", String(-data.discount)]);
    }
    rows.push(["Grand Total", String(grandTotal)]);

    // Convert to CSV
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${data.summaryNumber}_${data.clientName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  // Create new bill
  const handleNewBill = () => {
    reset();
    router.push("/dashboard/bills/new");
  };

  if (!data.clientId || data.items.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:p-0">
      <div className="print:hidden">
        <StepIndicator currentStep={4} />
      </div>

      {/* Summary Card */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Invoice Summary</CardTitle>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Client & Invoice Info */}
          <div className="grid sm:grid-cols-2 gap-6 pb-4 border-b">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Client</h3>
              <p className="text-lg font-medium">{data.clientName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Bill #</h3>
                <p className="font-medium">{data.summaryNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Date</h3>
                <p className="font-medium">{data.date}</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Tax Period</h3>
                <p className="font-medium">{data.taxPeriod}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Line Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">QTY</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {calculateItemTotal(item).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {calculateItemTaxTotal(item).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Tax Breakdown */}
          {Object.keys(taxSummary).length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tax Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(taxSummary).map(([name, amount]) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span>PKR {amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Tax</span>
              <span>PKR {totalTax.toLocaleString()}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-PKR {data.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Grand Total</span>
              <span>PKR {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
              Invoice saved successfully!
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t print:hidden">
            <Button variant="outline" onClick={() => router.push("/dashboard/bills/new/taxes")}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleNewBill}>
                + Create New Bill
              </Button>
              {!saved ? (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? "Saving..." : "Save Invoice"}
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
