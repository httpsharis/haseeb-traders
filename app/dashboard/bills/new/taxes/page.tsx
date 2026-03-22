"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  StepIndicator,
  LiveCalculator,
  useWizard,
  TaxType,
  TaxCharge,
  calculateItemTotal,
} from "@/components/bills";

export default function TaxesPage() {
  const router = useRouter();
  const { data, updateItem, setDiscount } = useWizard();

  // Redirect if no items
  useEffect(() => {
    if (!data.clientId || data.items.length === 0) {
      router.push("/dashboard/bills/new");
    }
  }, [data.clientId, data.items.length, router]);

  // Tax types from DB
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [loadingTax, setLoadingTax] = useState(true);

  useEffect(() => {
    fetch("/api/tax-types")
      .then((res) => res.json())
      .then((types) => {
        setTaxTypes(types.filter((t: TaxType) => t.isActive));
        setLoadingTax(false);
      })
      .catch(() => setLoadingTax(false));
  }, []);

  // Track which items have which taxes applied
  // Key: itemId, Value: array of applied tax type _ids with custom base amounts
  const [itemTaxes, setItemTaxes] = useState<Record<string, Record<string, number>>>(() => {
    // Initialize from existing data
    const initial: Record<string, Record<string, number>> = {};
    data.items.forEach((item) => {
      initial[item.id] = {};
      item.taxes.forEach((tax) => {
        const taxType = taxTypes.find((t) => t.name === tax.name);
        if (taxType) {
          initial[item.id][taxType._id] = tax.baseAmount;
        }
      });
    });
    return initial;
  });

  // Toggle tax for an item
  const toggleTax = (itemId: string, taxTypeId: string) => {
    setItemTaxes((prev) => {
      const itemData = prev[itemId] || {};
      const item = data.items.find((i) => i.id === itemId);
      const itemTotal = item ? calculateItemTotal(item) : 0;

      if (taxTypeId in itemData) {
        // Remove tax
        const { [taxTypeId]: removed, ...rest } = itemData;
        return { ...prev, [itemId]: rest };
      } else {
        // Add tax with item total as default base
        return { ...prev, [itemId]: { ...itemData, [taxTypeId]: itemTotal } };
      }
    });
  };

  // Update base amount for a tax
  const updateBaseAmount = (itemId: string, taxTypeId: string, baseAmount: number) => {
    setItemTaxes((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [taxTypeId]: baseAmount },
    }));
  };

  // Apply taxes to items when moving to next step
  const applyTaxesToItems = () => {
    data.items.forEach((item) => {
      const itemTaxData = itemTaxes[item.id] || {};
      const newTaxes: TaxCharge[] = [];

      Object.entries(itemTaxData).forEach(([taxTypeId, baseAmount]) => {
        const taxType = taxTypes.find((t) => t._id === taxTypeId);
        if (taxType && baseAmount > 0) {
          newTaxes.push({
            name: taxType.name,
            percentage: taxType.percentage,
            baseAmount: baseAmount,
            amount: Math.round(baseAmount * (taxType.percentage / 100)),
          });
        }
      });

      updateItem(item.id, { taxes: newTaxes });
    });
  };

  const handleNext = () => {
    applyTaxesToItems();
    router.push("/dashboard/bills/new/summary");
  };

  const handleAddMoreItems = () => {
    applyTaxesToItems();
    router.push("/dashboard/bills/new/items");
  };

  if (!data.clientId || data.items.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Apply Taxes</h1>
      <StepIndicator currentStep={3} />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Tax Types Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Available Tax Types</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTax ? (
                <p className="text-muted-foreground">Loading tax types...</p>
              ) : taxTypes.length === 0 ? (
                <p className="text-muted-foreground">No tax types configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {taxTypes.map((tax) => (
                    <span
                      key={tax._id}
                      className="px-3 py-1 bg-muted rounded-full text-sm"
                    >
                      {tax.name} ({tax.percentage}%)
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items with Tax Configuration */}
          {data.items.map((item, idx) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex justify-between">
                  <span>
                    #{idx + 1} - {item.description}
                  </span>
                  <span className="text-muted-foreground">
                    Base: PKR {calculateItemTotal(item).toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tax toggles */}
                  <div className="flex flex-wrap gap-2">
                    {taxTypes.map((taxType) => {
                      const isApplied = taxType._id in (itemTaxes[item.id] || {});
                      return (
                        <button
                          key={taxType._id}
                          onClick={() => toggleTax(item.id, taxType._id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isApplied
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {taxType.name} {taxType.percentage}%
                        </button>
                      );
                    })}
                  </div>

                  {/* Base amount inputs for applied taxes */}
                  {Object.keys(itemTaxes[item.id] || {}).length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tax</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Base Amount</TableHead>
                          <TableHead className="text-right">Tax Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(itemTaxes[item.id] || {}).map(([taxTypeId, baseAmount]) => {
                          const taxType = taxTypes.find((t) => t._id === taxTypeId);
                          if (!taxType) return null;
                          const taxAmount = Math.round(baseAmount * (taxType.percentage / 100));
                          return (
                            <TableRow key={taxTypeId}>
                              <TableCell>{taxType.name}</TableCell>
                              <TableCell>{taxType.percentage}%</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={baseAmount}
                                  onChange={(e) =>
                                    updateBaseAmount(item.id, taxTypeId, Number(e.target.value))
                                  }
                                  className="h-8 w-32"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                PKR {taxAmount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Discount */}
          <Card>
            <CardHeader>
              <CardTitle>Discount (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <label className="text-sm">Discount Amount (PKR)</label>
                <Input
                  type="number"
                  min={0}
                  value={data.discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-40"
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/dashboard/bills/new/items")}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleAddMoreItems}>
                + Add More Items
              </Button>
              <Button onClick={handleNext}>Next: Summary</Button>
            </div>
          </div>
        </div>

        {/* Calculator sidebar */}
        <div className="lg:col-span-1">
          <LiveCalculator />
        </div>
      </div>
    </div>
  );
}
