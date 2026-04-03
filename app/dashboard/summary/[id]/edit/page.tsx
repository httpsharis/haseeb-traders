"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

type BillType = { 
  _id: string; 
  description: string; 
  amount: number; 
  baseAmount: number; 
  taxAmount: number; 
};

export default function EditSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const summaryId = params.id as string;

  const [clientName, setClientName] = useState("");
  const [availableBills, setAvailableBills] = useState<BillType[]>([]);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [incomeTax, setIncomeTax] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const sumRes = await fetch(`/api/summaries/${summaryId}`);
        const summary = await sumRes.json();
        
        setClientName(summary.client?.name || "Unknown");
        setSelectedBills(summary.bills.map((b: { _id: string }) => b._id));
        
        if (summary.summaryTaxes?.length > 0) {
          setIncomeTax(summary.summaryTaxes[0].percentage);
        }

        const billsRes = await fetch(`/api/bills?clientId=${summary.client?._id}&status=Unbilled`);
        const unbilled = await billsRes.json();

        setAvailableBills([...summary.bills, ...unbilled]);
      } catch (error) {
        console.error("Failed to load edit data", error);
      }
    }
    if (summaryId) loadData();
  }, [summaryId]);

  const toggleBill = (id: string) => {
    setSelectedBills(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const selectedDocs = availableBills.filter(b => selectedBills.includes(b._id));
  const subTotal = selectedDocs.reduce((sum, b) => sum + (b.amount || 0), 0);
  const taxAmount = (subTotal * incomeTax) / 100;
  const netPayable = subTotal + taxAmount;

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const payload = {
        bills: selectedBills,
        totalBaseAmount: selectedDocs.reduce((sum, b) => sum + (b.baseAmount || 0), 0),
        totalTaxAmount: selectedDocs.reduce((sum, b) => sum + (b.taxAmount || 0), 0),
        summarySubTotal: subTotal,
        summaryTaxes: [{ name: "Income Tax", percentage: incomeTax, amount: taxAmount }],
        netPayable: netPayable,
      };

      const res = await fetch(`/api/summaries/${summaryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) router.push("/dashboard/summary");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-300 mx-auto pt-8 space-y-8 px-4 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900">Edit Summary</h1>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-bold text-slate-800">Client: {clientName}</h3>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Select Bills</h3>
        <div className="space-y-3">
          {availableBills.map(bill => (
            <div key={bill._id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-[#ea580c]"
                checked={selectedBills.includes(bill._id)}
                onChange={() => toggleBill(bill._id)}
              />
              <div className="flex-1">
                <p className="font-bold">{bill.description || "Bill Item"}</p>
              </div>
              <p className="font-bold">Rs {bill.amount}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
        <div className="flex justify-between items-center border-t pt-4">
          <div className="flex items-center gap-4">
            <label className="font-bold">Income Tax (%)</label>
            <input 
              type="number" 
              className="w-24 p-2 border rounded"
              value={incomeTax}
              onChange={(e) => setIncomeTax(Number(e.target.value))}
            />
          </div>
          <div className="text-right">
            <p className="text-slate-500">Subtotal: Rs {subTotal}</p>
            <p className="text-red-500">Tax: Rs {taxAmount}</p>
            <p className="text-2xl font-black text-slate-900 mt-2">Total: Rs {netPayable}</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
           <Button onClick={handleUpdate} disabled={isSaving} className="bg-[#ea580c] text-white hover:bg-[#d44d0a]">
             {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
             Update Summary
           </Button>
        </div>
      </div>
    </div>
  );
}