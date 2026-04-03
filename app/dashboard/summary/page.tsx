"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Search,
  FileText,
  CheckSquare,
  Loader2,
  ArrowRight,
} from "lucide-react";

type ClientType = { _id: string; name?: string; companyName?: string };
type BillType = {
  _id: string;
  description?: string;
  date?: string;
  amount?: number;
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

export default function CreateSummaryStepOne() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingBills, setPendingBills] = useState<BillType[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bills?status=Unbilled")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPendingBills(data);
        else if (data?.bills && Array.isArray(data.bills))
          setPendingBills(data.bills);
        else setPendingBills([]);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
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
    if (searchTerm.trim() && filteredClients.length > 0)
      return filteredClients[0]._id;
    return null;
  }, [selectedClient, searchTerm, filteredClients]);

  const clientBills = useMemo(() => {
    if (!activeClientId) return [];
    return pendingBills.filter((b) => getClientId(b.client) === activeClientId);
  }, [pendingBills, activeClientId]);

  const allSelected =
    clientBills.length > 0 && selectedBills.length === clientBills.length;

  function toggleBill(id: string) {
    setSelectedBills((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : prev.concat(id),
    );
  }

  function toggleSelectAll() {
    setSelectedBills(allSelected ? [] : clientBills.map((b) => b._id));
  }

  function handleProceed() {
    if (!activeClientId || selectedBills.length === 0) return;
    const query = new URLSearchParams({
      clientId: activeClientId,
      bills: selectedBills.join(","),
    });
    router.push(`/dashboard/summary/new/setup?${query.toString()}`);
  }

  return (
    <div className="max-w-300 mx-auto pt-8 space-y-8 px-4 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900">
        Step 1: Select Bills
      </h1>

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
                setSelectedBills([]);
              }}
            />
          </div>

          {isLoading ? (
            <div className="py-6 text-slate-500 flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading
              clients...
            </div>
          ) : (
            <div className="space-y-2 max-h-125 overflow-y-auto pr-2">
              {filteredClients.map((client) => (
                <button
                  key={client._id}
                  onClick={() => {
                    setSelectedClient(client._id);
                    setSelectedBills([]); // <-- ADD THIS
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeClientId === client._id
                      ? "bg-orange-100 text-orange-900 border border-orange-200"
                      : "hover:bg-slate-50 text-slate-700 border border-transparent"
                  }`}
                >
                  {client.name || "Unknown Client"}
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No pending clients found.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          {!activeClientId ? (
            <div className="bg-white border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center text-slate-400 h-full">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-slate-600">
                Select a Client
              </h3>
              <p>Choose a client from the left to view pending bills.</p>
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
                    <CheckSquare className="w-4 h-4 mr-2" />{" "}
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
                          {bill.date
                            ? new Date(bill.date).toLocaleDateString()
                            : "No date"}
                        </p>
                      </div>
                      <p className="font-bold text-slate-900">
                        Rs {(bill.amount || 0).toLocaleString("en-PK")}
                      </p>
                    </div>
                  ))}
                  {clientBills.length === 0 && (
                    <p className="text-sm text-slate-500 py-2">
                      No unbilled items found.
                    </p>
                  )}
                </div>
              </div>

              {selectedBills.length > 0 && (
                <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center animate-in fade-in duration-300">
                  <p className="font-bold text-slate-700">
                    {selectedBills.length} Items Selected
                  </p>
                  <Button
                    onClick={handleProceed}
                    className="bg-[#ea580c] text-white hover:bg-[#d44d0a] px-8"
                  >
                    Proceed to Tax Setup <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
