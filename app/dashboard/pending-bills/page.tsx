"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, FileText, CheckSquare, Loader2 } from "lucide-react";

type ClientType = { _id: string; name?: string; companyName?: string };

type BillType = {
  _id: string;
  description?: string;
  date?: string;
  amount?: number;
  baseAmount?: number;
  taxAmount?: number;
  quantity?: number;
  unitPrice?: number;
  taxes?: { amount?: number }[];
  client?: ClientType | string | null;
};

function getClientId(client: BillType["client"]): string {
  if (!client) return "";
  if (typeof client === "string") return client;
  return client._id || "";
}

function getClientName(client: BillType["client"]): string {
  if (!client || typeof client === "string") return "";
  return (client.name || client.companyName || "").trim();
}

function getBillAmount(bill: BillType): number {
  if (typeof bill.amount === "number") return bill.amount;

  const base =
    typeof bill.baseAmount === "number"
      ? bill.baseAmount
      : (bill.quantity || 0) * (bill.unitPrice || 0);

  const tax =
    typeof bill.taxAmount === "number"
      ? bill.taxAmount
      : (bill.taxes || []).reduce((sum, t) => sum + (t.amount || 0), 0);

  return base + tax;
}

export default function PendingBillsPage() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [pendingBills, setPendingBills] = useState<BillType[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [incomeTax, setIncomeTax] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadBills() {
      setIsLoading(true);
      setErrorText("");

      try {
        const res = await fetch("/api/bills?status=Unbilled");
        if (!res.ok) {
          throw new Error("Failed to fetch pending bills");
        }

        const data: unknown = await res.json();

        if (!mounted) return;

        if (Array.isArray(data)) {
          setPendingBills(data as BillType[]);
        } else if (
          data &&
          typeof data === "object" &&
          Array.isArray((data as { bills?: unknown }).bills)
        ) {
          setPendingBills((data as { bills: BillType[] }).bills);
        } else {
          setPendingBills([]);
        }
      } catch (error) {
        if (mounted) {
          setPendingBills([]);
          setErrorText(
            error instanceof Error ? error.message : "Failed to fetch pending bills",
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadBills();

    return () => {
      mounted = false;
    };
  }, []);

  const uniqueClients = useMemo(() => {
    const map = new Map<string, ClientType>();

    for (const bill of pendingBills) {
      const id = getClientId(bill.client);
      if (!id || map.has(id)) continue;

      map.set(id, {
        _id: id,
        name: getClientName(bill.client) || "Unknown Client",
      });
    }

    return Array.from(map.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
  }, [pendingBills]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return uniqueClients;
    return uniqueClients.filter((c) =>
      (c.name || "").toLowerCase().includes(q),
    );
  }, [uniqueClients, searchTerm]);

  const activeClientId = useMemo(() => {
    if (selectedClient) return selectedClient;

    if (searchTerm.trim() && filteredClients.length > 0) {
      return filteredClients[0]._id;
    }

    return null;
  }, [selectedClient, searchTerm, filteredClients]);

  useEffect(() => {
    setSelectedBills([]);
  }, [activeClientId]);

  const clientBills = useMemo(() => {
    if (!activeClientId) return [];
    return pendingBills.filter((b) => getClientId(b.client) === activeClientId);
  }, [pendingBills, activeClientId]);

  const selectedDocs = useMemo(
    () => clientBills.filter((b) => selectedBills.includes(b._id)),
    [clientBills, selectedBills],
  );

  const subTotal = useMemo(
    () => selectedDocs.reduce((sum, b) => sum + getBillAmount(b), 0),
    [selectedDocs],
  );

  const taxAmount = useMemo(() => (subTotal * incomeTax) / 100, [subTotal, incomeTax]);
  const netPayable = useMemo(() => subTotal + taxAmount, [subTotal, taxAmount]);

  const allSelected =
    clientBills.length > 0 && selectedBills.length === clientBills.length;

  function toggleBill(id: string) {
    setSelectedBills((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : prev.concat(id),
    );
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedBills([]);
      return;
    }
    setSelectedBills(clientBills.map((b) => b._id));
  }

  async function handleGenerateSummary() {
    if (!activeClientId || selectedBills.length === 0) return;

    setIsSaving(true);
    setErrorText("");

    try {
      const payload = {
        client: activeClientId,
        summaryNumber: "SUM-" + Date.now(),
        date: new Date().toISOString(),
        taxPeriod: "Current Month",
        bills: selectedBills,
        summarySubTotal: subTotal,
        summaryTaxes:
          incomeTax > 0
            ? [{ name: "Income Tax", percentage: incomeTax, amount: taxAmount }]
            : [],
        netPayable: netPayable,
        status: "Draft",
      };

      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || "Failed to generate summary",
        );
      }

      router.push("/dashboard/summaries");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Failed to generate summary",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-300 mx-auto pt-8 space-y-8 px-4 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900">Pending Bills Inbox</h1>

      {errorText ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorText}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-xl border shadow-sm h-fit">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedClient(null);
              }}
            />
          </div>

          {isLoading ? (
            <div className="py-6 text-slate-500 flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading clients...
            </div>
          ) : (
            <div className="space-y-2 max-h-125 overflow-y-auto pr-2">
              {filteredClients.map((client) => (
                <button
                  key={client._id}
                  onClick={() => setSelectedClient(client._id)}
                  className={
                    "w-full text-left px-4 py-3 rounded-lg font-medium transition-colors " +
                    (activeClientId === client._id
                      ? "bg-orange-100 text-orange-900 border border-orange-200"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent")
                  }
                >
                  {client.name || "Unknown Client"}
                </button>
              ))}

              {filteredClients.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No pending clients found.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          {!activeClientId ? (
            <div className="bg-white border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center text-slate-400 h-full">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-slate-600">Select a Client</h3>
              <p>Type in search or choose a client from the left.</p>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Unbilled Items</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {allSelected ? "Clear All" : "Select All"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {clientBills.map((bill) => (
                    <div
                      key={bill._id}
                      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleBill(bill._id)}
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#ea580c] pointer-events-none"
                        checked={selectedBills.includes(bill._id)}
                        readOnly
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">
                          {bill.description || "Bill Item"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {bill.date ? new Date(bill.date).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                      <p className="font-bold text-slate-900">
                        Rs {getBillAmount(bill).toLocaleString("en-PK")}
                      </p>
                    </div>
                  ))}

                  {clientBills.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No unbilled items found for this client.
                    </p>
                  ) : null}
                </div>
              </div>

              {selectedBills.length > 0 ? (
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-center gap-4">
                      <label className="font-bold text-slate-700">Add Income Tax (%)</label>
                      <input
                        type="number"
                        min={0}
                        className="w-24 p-2 border rounded-lg bg-slate-50"
                        value={incomeTax}
                        onChange={(e) => setIncomeTax(Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-slate-500 font-medium mb-1">
                        Subtotal: Rs {subTotal.toLocaleString("en-PK")}
                      </p>
                      <p className="text-red-500 font-medium mb-2">
                        Tax: Rs {taxAmount.toLocaleString("en-PK")}
                      </p>
                      <p className="text-3xl font-black text-slate-900">
                        Rs {netPayable.toLocaleString("en-PK")}
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateSummary}
                      disabled={isSaving}
                      className="bg-[#ea580c] text-white hover:bg-[#d44d0a] h-12 px-6 text-lg font-bold"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-5 h-5 mr-2" />
                      )}
                      Generate Summary
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
