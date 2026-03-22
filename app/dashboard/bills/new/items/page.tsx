"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Printer, Trash2, ReceiptText } from "lucide-react";
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
import { StepIndicator, useWizard, Category, LineItem } from "@/components/bills";

// Helper to format money cleanly
function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ItemDetailsPage() {
  const router = useRouter();
  const { data, addItem, removeItem } = useWizard();

  // Redirect if client is missing
  useEffect(() => {
    if (!data.clientId) {
      router.push("/dashboard/bills/new");
    }
  }, [data.clientId, router]);

  // Database Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalCategory, setGlobalCategory] = useState("");
  
  // New Category Modal State
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((cats) => {
        // Handle both array and { data: [...] } responses just in case
        const catArray = Array.isArray(cats) ? cats : cats.data || [];
        setCategories(catArray.filter((c: Category) => c.isActive !== false));
      })
      .catch((err) => console.error("Failed to load categories", err));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), isActive: true }),
      });
      const newCat = await res.json();
      setCategories([...categories, newCat]);
      setGlobalCategory(newCat.name);
      setShowNewCat(false);
      setNewCatName("");
    } catch (err) {
      console.error("Failed to create category", err);
    }
    setSavingCat(false);
  };

  // Form state
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1"); // Default to 1 to prevent silent fails
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("");

  const handleAddItem = () => {
    if (!desc || !qty || !price || !globalCategory) return;
    const gstRate = Number(gst) || 0;
    const baseAmount = Number(qty) * Number(price);
    const gstAmount = gstRate > 0 ? (baseAmount * gstRate) / 100 : 0;
    const itemTaxes = gstRate > 0
      ? [{
          name: "GST",
          percentage: gstRate,
          baseAmount: baseAmount,
          amount: gstAmount,
        }]
      : [];

    const newItem: LineItem = {
      id: `item_${Date.now()}`,
      billNumber: String(data.items.length + 1),
      date: data.date,
      description: desc,
      category: globalCategory,
      quantity: Number(qty),
      unitPrice: Number(price),
      taxes: itemTaxes,
    };

    addItem(newItem);

    // Clear form inputs but keep qty at 1
    setDesc("");
    setQty("1");
    setPrice("");
    setGst("");
  };

  // Live Calculations
  const baseAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
  const gstAmount = data.items.reduce((sum, item) => {
    const itemGst = item.taxes?.find(t => t.name === "GST");
    const amount = itemGst ? itemGst.amount : 0;
    return sum + amount;
  }, 0);

  const grandTotal = baseAmount + gstAmount;

  if (!data.clientId) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-muted-foreground mt-2">Step 2 of 4: Line Items</p>
      </div>

      <StepIndicator currentStep={2} />

      {/* Client Context Banner */}
      <div className="flex gap-6 text-sm bg-slate-50 border px-4 py-3 rounded-lg text-slate-600">
        <div><span className="font-semibold text-slate-900">Client:</span> {data.clientName}</div>
        <div><span className="font-semibold text-slate-900">Summary #:</span> {data.summaryNumber}</div>
        <div><span className="font-semibold text-slate-900">Period:</span> {data.taxPeriod}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form and Table */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Global Category Selection */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Bill Category <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  <select
                    value={globalCategory}
                    onChange={(e) => setGlobalCategory(e.target.value)}
                    className="flex-1 h-11 rounded-md border border-input bg-slate-50/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a category for all items...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={() => setShowNewCat(true)}
                    className="bg-[#ea580c] hover:bg-[#ea580c]/90 h-11 w-11 p-0 shrink-0"
                    title="Add new category"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Item Form */}
          <Card className="shadow-sm border">
            <CardHeader className="bg-slate-50/50 pb-4 border-b">
              <CardTitle className="text-lg text-slate-800">Add New Item</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-12 md:col-span-4 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                  <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Item name" />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</label>
                  <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST %</label>
                  <Input type="number" value={gst} onChange={(e) => setGst(e.target.value)} placeholder="0" min="0" />
                </div>
                <div className="col-span-12 md:col-span-2">
                  <Button 
                    onClick={handleAddItem} 
                    className="w-full bg-[#ea580c] text-white hover:bg-[#ea580c]/90"
                    disabled={!desc || !price || !qty || !globalCategory}
                  >
                    <Plus className="size-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              {!globalCategory && (
                <p className="text-xs text-red-500 mt-3">* Please select or create a Bill Category first.</p>
              )}
            </CardContent>
          </Card>

          {/* Line Items Table */}
          <Card className="shadow-sm overflow-hidden border">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-12.5">SR#</TableHead>
                  <TableHead>DESCRIPTION</TableHead>
                  <TableHead className="text-right">QTY</TableHead>
                  <TableHead className="text-right">PRICE</TableHead>
                  <TableHead className="text-right">TOTAL</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No items added yet. Fill out the form above.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{String(index + 1).padStart(2, '0')}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatMoney(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(item.quantity * item.unitPrice)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Right Column: Live Settlement Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-md border-slate-200 sticky top-6">
            <CardHeader className="pb-4 border-b bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ReceiptText className="size-5 text-[#ea580c]" />
                <CardTitle className="text-lg">Live Settlement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Amount</span>
                  <span className="font-medium text-slate-900">{formatMoney(baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item GST</span>
                  <span className="font-medium text-slate-900">{formatMoney(gstAmount)}</span>
                </div>
              </div>

              <div className="pt-4 border-t flex items-end justify-between">
                <span className="font-bold text-lg text-slate-800">Grand<br/>Total</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#ea580c] pr-1">PKR</span>
                  <span className="text-3xl font-bold text-[#ea580c] leading-none">
                    {formatMoney(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => router.push("/dashboard/bills/new/taxes")}
                  disabled={data.items.length === 0}
                  className="w-full bg-[#ea580c] hover:bg-[#ea580c]/90 h-12 text-md disabled:opacity-50"
                >
                  Next: Add Taxes <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button variant="outline" className="w-full h-12 text-slate-600 bg-white">
                  <Printer className="mr-2 size-4" /> Print Current Bill
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* New Category Modal */}
      {showNewCat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  placeholder="e.g., Electronics, Services..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewCat(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={savingCat || !newCatName.trim()}
                  className="bg-[#ea580c] hover:bg-[#ea580c]/90 text-white"
                >
                  {savingCat ? "Saving..." : "Save Category"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}