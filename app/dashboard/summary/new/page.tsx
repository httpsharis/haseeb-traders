"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BillType, ClientType, getClientId, getClientName } from "@/lib/summaryHelper";
import { ClientSidebar } from "@/components/features/summaries/ClientSidebar";
import { ClientBillsTable } from "@/components/features/summaries/ClientBill";

export default function CreateSummaryStepOne() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingBills, setPendingBills] = useState<BillType[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  function handleClientSelect(id: string) {
    setSelectedClient(id);
    setSelectedBills([]); 
  }

  function handleSearchChange(term: string) {
    setSearchTerm(term);
    setSelectedClient(null);
    setSelectedBills([]); 
  }

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
      <ClientSidebar 
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        isLoading={isLoading}
        filteredClients={filteredClients}
        activeClientId={activeClientId}
        onSelectClient={handleClientSelect}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
        <ClientBillsTable 
          activeClientId={activeClientId}
          currentClientBills={currentClientBills}
          selectedBills={selectedBills}
          toggleBill={toggleBill}
          toggleSelectAll={toggleSelectAll}
          handleProceed={handleProceed}
        />
      </div>
    </div>
  );
}