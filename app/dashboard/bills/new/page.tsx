"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepIndicator, useWizard, Client } from "@/components/bills";

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const { data, setClientInfo } = useWizard();

  // Generate tax period options (current month + past 11 months)
  const taxPeriodOptions = useMemo(() => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
    }
    return options;
  }, []);

  // Get default tax period
  const defaultTaxPeriod = data.taxPeriod || taxPeriodOptions[0] || "";

  // Form state - initialize with defaults
  const [clientId, setClientId] = useState(data.clientId);
  const [clientName, setClientName] = useState(data.clientName);
  const [summaryNumber, setSummaryNumber] = useState(data.summaryNumber);
  const [taxPeriod, setTaxPeriod] = useState(defaultTaxPeriod);
  const [date, setDate] = useState(data.date);

  // Client search/dropdown
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // New client modal
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch clients
  useEffect(() => {
    fetch("/api/clients?limit=100")
      .then((res) => res.json())
      .then((result) => {
        setClients(result.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Auto-generate summary number
  useEffect(() => {
    if (!summaryNumber) {
      fetch("/api/summaries?limit=1")
        .then((res) => res.json())
        .then((result) => {
          const lastNum = result.data?.[0]?.summaryNumber;
          const parsed = lastNum ? parseInt(lastNum, 10) : 0;
          const next = String(isNaN(parsed) ? 1 : parsed + 1);
          setSummaryNumber(next);
        })
        .catch(() => setSummaryNumber("1"));
    }
  }, [summaryNumber]);

  // Filter clients by search
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    setClientId(client._id);
    setClientName(client.name);
    setSearchQuery(client.name);
    setShowDropdown(false);
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName.trim() }),
      });
      const newClient = await res.json();
      setClients([...clients, newClient]);
      setClientId(newClient._id);
      setClientName(newClient.name);
      setSearchQuery(newClient.name);
      setShowNewClient(false);
      setNewClientName("");
    } catch (err) {
      console.error("Failed to create client", err);
    }
    setSaving(false);
  };

  const handleNext = () => {
    if (!clientId || !summaryNumber || !taxPeriod || !date) return;
    setClientInfo(clientId, clientName, summaryNumber, taxPeriod, date);
    router.push("/dashboard/bills/new/items");
  };

  const isValid = clientId && summaryNumber && taxPeriod && date;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-muted-foreground mt-2">
          Step 1: Provide general invoice details
        </p>
      </div>

      <StepIndicator currentStep={1} />

      <Card className="shadow-sm border rounded-xl">
        <CardContent className="p-8 space-y-8">
          {/* Client Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Client</label>
            <div className="relative">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search and select client..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                      if (!e.target.value) {
                        setClientId("");
                        setClientName("");
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="pl-9 bg-slate-50/50 h-11"
                  />
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowNewClient(true)}
                  title="Add new client"
                  className="bg-[#ea580c] hover:bg-[#ea580c]/90 h-11 w-11 p-0 shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="p-3 text-muted-foreground text-sm">Loading...</div>
                  ) : filteredClients.length === 0 ? (
                    <div className="p-3 text-muted-foreground text-sm">
                      No clients found. Click + to add.
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client._id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                          clientId === client._id ? "bg-muted font-medium" : ""
                        }`}
                      >
                        {client.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bill Number & Date Row */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Bill #</label>
              <Input
                value={summaryNumber}
                onChange={(e) => setSummaryNumber(e.target.value)}
                placeholder="Auto-generated"
                className="bg-slate-50/50 h-11"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Invoice Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9 bg-slate-50/50 h-11"
                />
              </div>
            </div>
          </div>

          {/* Tax Period */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Tax Period</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={taxPeriod}
                onChange={(e) => setTaxPeriod(e.target.value)}
                className="w-full h-11 rounded-md border border-input bg-slate-50/50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">Select tax period...</option>
                {taxPeriodOptions.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" className="px-8 h-11" onClick={() => router.push("/dashboard")}>
          Cancel
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="bg-[#ea580c] hover:bg-[#ea580c]/90 px-8 h-11"
        >
          Next: Item Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* New Client Modal */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Name</label>
                <Input
                  placeholder="Enter client name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewClient(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateClient}
                  disabled={saving || !newClientName.trim()}
                  className="bg-[#ea580c] hover:bg-[#ea580c]/90"
                >
                  {saving ? "Adding..." : "Add Client"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}