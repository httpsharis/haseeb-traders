"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, FileText, ArrowRight, CheckSquare, Square } from "lucide-react";

type ClientType = { _id: string; name?: string; companyName?: string };

type BillItem = {
  amount?: string | number;
  total?: string | number;
  quantity?: string | number;
  price?: string | number;
  unitPrice?: string | number;
  rate?: string | number;
};

type BillType = { 
  _id: string; 
  description?: string; 
  category?: string;
  billNumber?: string;
  invoiceNumber?: string;
  date?: string; 
  amount?: number | string; 
  baseAmount?: number | string;
  subTotal?: number | string;
  totalAmount?: number | string;
  netAmount?: number | string;
  total?: number | string;
  quantity?: number | string;
  unitPrice?: number | string;
  price?: number | string;
  client?: ClientType | string | null; 
  items?: BillItem[];
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

function parseAmt(val: string | number | undefined | null): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const num = Number(val.toString().replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

function getBaseAmount(bill: BillType): number {
  const directTotals = [bill.baseAmount, bill.amount, bill.subTotal, bill.totalAmount, bill.netAmount, bill.total];
  for (const t of directTotals) {
    const val = parseAmt(t);
    if (val > 0) return val;
  }

  if (Array.isArray(bill.items) && bill.items.length > 0) {
    let sum = 0;
    bill.items.forEach((item) => {
      const itemTotal = parseAmt(item.amount) || parseAmt(item.total) || ( (parseAmt(item.quantity) || 1) * parseAmt(item.price || item.unitPrice || item.rate) );
      sum += itemTotal;
    });
    if (sum > 0) return sum;
  }

  const flat = (parseAmt(bill.quantity) || 1) * parseAmt(bill.unitPrice || bill.price);
  return flat > 0 ? flat : 0;
}

export default function CreateSummaryStepOne() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingBills, setPendingBills] = useState<BillType[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // FIX: Removed the ?status=Unbilled filter so ALL bills load
    fetch(`/api/bills?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.bills || data.data || []);
        setPendingBills(arr);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const uniqueClients = useMemo(() => {
    const map = new Map<string, ClientType>();
    for (const bill of pendingBills) {
      const id = getClientId(bill.client);
      if (!id || map.has(id)) continue;
      map.set(id, { _id: id, name: getClientName(bill.client) || "Unknown Client" });
    }
    return Array.from(map.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [pendingBills]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return uniqueClients;
    return uniqueClients.filter(c => (c.name || "").toLowerCase().includes(q));
  }, [uniqueClients, searchTerm]);

  const activeClientId = useMemo(() => {
    if (selectedClient) return selectedClient;
    if (searchTerm.trim() && filteredClients.length > 0) return filteredClients[0]._id;
    return null;
  }, [selectedClient, searchTerm, filteredClients]);

  const currentClientBills = useMemo(() => {
    return pendingBills.filter(b => getClientId(b.client) === activeClientId);
  }, [pendingBills, activeClientId]);

  function toggleBill(id: string) {
    setSelectedBills(prev => prev.includes(id) ? prev.filter(b => b !== id) : prev.concat(id));
  }

  function toggleSelectAll() {
    setSelectedBills(selectedBills.length === currentClientBills.length ? [] : currentClientBills.map(b => b._id));
  }

  function handleProceed() {
    if (!activeClientId || selectedBills.length === 0) return;
    const query = new URLSearchParams({
      clientId: activeClientId,
      bills: selectedBills.join(",")
    });
    router.push(`/dashboard/summary/new/setup?${query.toString()}`);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 font-sans">
      
      <div className="w-[320px] border-r border-slate-200 bg-white flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Select Client</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-[#ea580c] transition-colors" />
            <input
              type="text"
              placeholder="Search directory..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-50 transition-all"
              value={searchTerm}
              onChange={(e) => { 
                setSearchTerm(e.target.value); 
                setSelectedClient(null);
                setSelectedBills([]); 
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-5 h-5 border-2 border-orange-200 border-t-[#ea580c] rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-medium uppercase tracking-wider">Loading...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredClients.map(client => {
                const isActive = activeClientId === client._id;
                return (
                  <button
                    key={client._id}
                    onClick={() => {
                      setSelectedClient(client._id);
                      setSelectedBills([]); 
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? "bg-orange-50 text-[#ea580c] shadow-sm ring-1 ring-orange-200" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {client.name || "Unknown Client"}
                  </button>
                );
              })}
              {filteredClients.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">No matching clients found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
        {!activeClientId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="p-6 bg-white rounded-full shadow-sm mb-6 border border-slate-100">
              <FileText className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-600 tracking-tight">No Client Selected</h3>
            <p className="text-sm mt-2 text-slate-500 font-medium">Choose a client from the directory to begin summarizing.</p>
          </div>
        ) : (
          <>
            <div className="px-10 py-8 border-b border-slate-200 bg-white flex justify-between items-end shrink-0 z-10">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Bills</h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">Select the bills you wish to include in this summary.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={toggleSelectAll} 
                className="h-10 px-6 text-sm font-bold border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-200 transition-colors"
              >
                {selectedBills.length === currentClientBills.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 pb-32">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[300px] relative">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
                    <tr>
                      <th className="w-16 py-4 px-6"></th>
                      <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-[25%]">Date</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-[40%]">Category / Details</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right w-[25%]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentClientBills.map(bill => {
                      const isSelected = selectedBills.includes(bill._id);
                      const displayTitle = bill.category || bill.description || bill.billNumber || `Bill #${bill._id.substring(0, 6).toUpperCase()}`;
                      
                      return (
                        <tr 
                          key={bill._id} 
                          onClick={() => toggleBill(bill._id)}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected ? "bg-orange-50/30" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-5 px-6">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-[#ea580c] transition-transform scale-110" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 transition-transform" />
                            )}
                          </td>
                          <td className="py-5 px-6 text-sm font-medium text-slate-500">
                            {bill.date ? new Date(bill.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-sm font-bold text-slate-900">{displayTitle}</p>
                          </td>
                          <td className="py-5 px-6 text-sm font-black text-slate-900 text-right">
                            Rs {getBaseAmount(bill).toLocaleString("en-PK")}
                          </td>
                        </tr>
                      );
                    })}
                    {currentClientBills.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50/50">
                          This client has no bills available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedBills.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-5 px-10 flex justify-between items-center animate-in slide-in-from-bottom-4 z-20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-black text-[#ea580c]">{selectedBills.length}</span>
                  </div>
                  <p className="font-bold text-slate-600 text-sm">
                    {selectedBills.length === 1 ? "Bill Selected" : "Bills Selected"}
                  </p>
                </div>
                <Button 
                  onClick={handleProceed} 
                  className="bg-[#ea580c] text-white hover:bg-[#d44d0a] hover:shadow-lg hover:shadow-orange-500/20 px-8 h-12 text-sm font-black transition-all"
                >
                  Proceed to Tax Setup <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}