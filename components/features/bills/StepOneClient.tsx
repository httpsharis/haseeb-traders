"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  Clock,
  Hash,
  Search,
  CheckCircle2,
  Plus,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBillDraft } from "@/hooks/useBillDraft";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Step1Client() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, updateData, resetDraft } = useBillDraft();

  // ✅ 1. ALL STATE DECLARATIONS AT THE VERY TOP
  const [clientId, setClientId] = useState(data.clientId || "");
  const [clientName, setClientName] = useState(data.clientName || "");
  const [summaryNumber, setSummaryNumber] = useState(data.summaryNumber || "");
  const [date, setDate] = useState(
    data.date || new Date().toISOString().split("T")[0],
  );
  const [taxPeriod, setTaxPeriod] = useState(data.taxPeriod || "");

  // ✅ 2. USE EFFECTS BELOW STATE
  // Reset draft when arriving fresh (e.g. clicking "Create Bill" from sidebar)
  useEffect(() => {
    if (searchParams.get("fresh") === "true") {
      setTimeout(() => {
        resetDraft();
        // Clear local form state perfectly
        setClientId("");
        setClientName("");
        setSummaryNumber("");
        setDate(new Date().toISOString().split("T")[0]);
        setTaxPeriod("");

        // Clean up the URL so back button doesn't trigger a reset
        router.replace("/dashboard/bills/new", { scroll: false });
      }, 0);
    }
  }, [searchParams, resetDraft, router]);

  // Sync inputs if draft gets wiped or injected from Edit Mode
  useEffect(() => {
    setTimeout(() => {
      setClientId(data.clientId || "");
      setClientName(data.clientName || "");
      setSummaryNumber(data.summaryNumber || "");
      setDate(data.date || new Date().toISOString().split("T")[0]);
      setTaxPeriod(data.taxPeriod || "");
    }, 0);
  }, [data]);

  const handleClientSelect = (id: string, name: string) => {
    setClientId(id);
    setClientName(name);
    updateData({ clientId: id, clientName: name });
  };

  const handleNext = () => {
    updateData({ clientId, clientName, summaryNumber, date, taxPeriod });
    router.push("/dashboard/bills/new/items");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="border-b border-stone-200 pb-5">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Invoice Setup
          </h2>
          <p className="text-sm font-medium text-stone-500">
            Select an existing client or add a new one, then configure the bill
            settings.
          </p>
        </div>
      </div>

      {/* ── Main Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Client Selection */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-6 uppercase tracking-widest">
            <Building2 className="h-4 w-4 text-stone-400" /> Client Information
          </h3>
          <ClientSelector
            selectedName={clientName}
            onSelect={handleClientSelect}
          />
        </div>

        {/* Right Side: Bill Details Form */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-6 uppercase tracking-widest">
            <Hash className="h-4 w-4 text-stone-400" /> Bill Information
          </h3>
          <BillDetailsForm
            clientName={clientName}
            summaryNumber={summaryNumber}
            setSummaryNumber={setSummaryNumber}
            date={date}
            setDate={setDate}
            taxPeriod={taxPeriod}
            setTaxPeriod={setTaxPeriod}
            // ✅ Edit Shield Enabled!
            isEditing={data.items && data.items.length > 0}
            originalNumber={data.summaryNumber}
          />
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="flex justify-end pt-4 border-t border-stone-200 mt-8">
        <Button
          onClick={handleNext}
          disabled={!clientName || !summaryNumber || !date || !taxPeriod}
          className="h-11 px-8 font-bold text-sm shadow-none rounded-lg transition-all disabled:opacity-50 bg-stone-900 hover:bg-stone-800 text-white"
        >
          Proceed to Line Items <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT 1: Client Selector
// ============================================================================

interface Client {
  _id: string;
  name: string;
}

interface ClientSelectorProps {
  selectedName: string;
  onSelect: (id: string, name: string) => void;
}

function ClientSelector({ selectedName, onSelect }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(selectedName || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    fetch("/api/clients?limit=100")
      .then((res) => res.json())
      .then((result) => {
        setClients(result.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTimeout(() => setSearchQuery(selectedName || ""), 0);
  }, [selectedName]);

  const filtered = clients.filter((c) => {
    // 1. Give them fallback empty strings if they are undefined
    const safeName = c.name || "";
    const safeQuery = searchQuery || "";

    // 2. Safely run the comparison
    return safeName.toLowerCase().includes(safeQuery.toLowerCase());
  });
  const handleClientCreated = (newClient: Client) => {
    setClients([...clients, newClient]);
    onSelect(newClient._id, newClient.name);
    setSearchQuery(newClient.name);
    setShowNewClient(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.preventDefault();
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && filtered.length > 0) {
      e.preventDefault();
      const selected = filtered[activeIndex];
      onSelect(selected._id, selected.name);
      setSearchQuery(selected.name);
      setShowDropdown(false);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-2.5 relative">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
          Select Client
        </label>
        {selectedName && (
          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" /> SELECTED
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${selectedName ? "text-green-500" : "text-stone-400 group-focus-within:text-stone-900"}`}
          />
          <Input
            placeholder="Search and select client..."
            value={searchQuery || ""}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(-1);
              setShowDropdown(true);
              if (selectedName && e.target.value !== selectedName) {
                onSelect("", "");
              }
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            className={`pl-10 h-11 transition-all rounded-lg font-medium shadow-none ${
              selectedName
                ? "bg-green-50/30 border-green-200 text-green-900 focus:ring-green-500 focus:border-green-500"
                : "bg-stone-50/50 border-stone-200 text-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
            }`}
          />
        </div>
        <Button
          onClick={() => setShowNewClient(true)}
          variant="outline"
          className="h-11 w-11 p-0 shrink-0 rounded-lg shadow-none border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all focus-visible:ring-1 focus-visible:ring-stone-900"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-stone-100 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 py-1">
          {loading ? (
            <div className="p-3 text-sm text-stone-400 font-medium text-center">
              Loading clients...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-2">
              <div className="p-3 text-sm text-stone-500 text-center mb-1">
                No clients found.
              </div>
              <Button
                variant="outline"
                className="w-full border-dashed border-stone-200 text-stone-600 hover:bg-stone-50 font-bold shadow-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowDropdown(false);
                  setShowNewClient(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Add &quot{searchQuery}&quot
              </Button>
            </div>
          ) : (
            filtered.map((client, index) => (
              <button
                key={client._id || `fallback-client-${index}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(client._id, client.name);
                  setSearchQuery(client.name);
                  setShowDropdown(false);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                                    ${activeIndex === index ? "bg-stone-100 text-stone-900" : "text-stone-600 hover:bg-stone-50"}`}
              >
                {client.name}
              </button>
            ))
          )}
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {showNewClient && (
        <AddClientPopup
          initialName={filtered.length === 0 ? searchQuery : ""}
          onClose={() => setShowNewClient(false)}
          onSuccess={handleClientCreated}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT 2: Add Client Popup
// ============================================================================

interface AddClientPopupProps {
  initialName?: string;
  onClose: () => void;
  onSuccess: (newClient: { _id: string; name: string }) => void;
}

function AddClientPopup({
  initialName = "",
  onClose,
  onSuccess,
}: AddClientPopupProps) {
  const [newClientName, setNewClientName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName.trim() }),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "Failed to create client.");
      }

      const createdClient = payload?.data ?? payload;
      if (!createdClient?._id || !createdClient?.name) {
        throw new Error("Unexpected server response while creating client.");
      }

      onSuccess(createdClient);
    } catch (err) {
      console.error("Failed to create client", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create client.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              Add New Client
            </h2>
            <p className="text-sm font-medium text-stone-500 mt-1">
              Create a new profile to start generating invoices.
            </p>
          </div>

          <div className="mb-8">
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">
              Client Name
            </label>
            <Input
              placeholder="e.g. Acme Corp"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newClientName.trim()) {
                  e.preventDefault();
                  handleCreateClient();
                }
              }}
              className="h-11 w-full bg-stone-50/50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-stone-900 focus-visible:border-stone-900 transition-all shadow-none rounded-lg font-medium"
            />
            {errorMessage && (
              <p className="mt-2 text-sm font-medium text-red-600">{errorMessage}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-10 px-4 text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-bold rounded-lg shadow-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={saving || !newClientName.trim()}
              className="h-10 px-6 font-bold shadow-none rounded-lg disabled:opacity-50 bg-primary text-white hover:bg-primary/90"
            >
              {saving ? "Saving..." : "Save Client"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT 3: Bill Details Form
// ============================================================================

interface BillDetailsProps {
  clientName: string;
  summaryNumber: string;
  setSummaryNumber: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  taxPeriod: string;
  setTaxPeriod: (val: string) => void;
  isEditing: boolean;
  originalNumber: string;
}

function BillDetailsForm({
  clientName,
  summaryNumber,
  setSummaryNumber,
  date,
  setDate,
  taxPeriod,
  setTaxPeriod,
  isEditing,
  originalNumber,
}: BillDetailsProps) {
  const [baseSequence, setBaseSequence] = useState<number | null>(null);

  const taxPeriodOptions = useMemo(() => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push(
        d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      );
    }
    return options;
  }, []);

  useEffect(() => {
    if (!taxPeriod && taxPeriodOptions.length > 0) {
      setTaxPeriod(taxPeriodOptions[0]);
    }
  }, [taxPeriod, taxPeriodOptions, setTaxPeriod]);

  useEffect(() => {
    if (baseSequence === null) {
      fetch("/api/summaries?limit=1")
        .then((res) => res.json())
        .then((result) => {
          const lastNum = result.data?.[0]?.summaryNumber;
          const match = String(lastNum).match(/\d{3}$/);
          const parsed = match ? parseInt(match[0], 10) : 0;
          setBaseSequence(isNaN(parsed) ? 1 : parsed + 1);
        })
        .catch(() => setBaseSequence(1));
    }
  }, [baseSequence]);

  // ✅ THE SHIELD: Protects injected edit data from being overwritten
  useEffect(() => {
    if (isEditing && originalNumber) {
      setSummaryNumber(originalNumber);
      return;
    }

    if (baseSequence !== null && clientName && taxPeriod) {
      const initials = clientName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 3)
        .toUpperCase();
      const [month, year] = taxPeriod.split(" ");
      const formattedPeriod = `${month.toUpperCase()}${year.substring(2)}`;
      const paddedSeq = String(baseSequence).padStart(3, "0");

      setSummaryNumber(`${initials}-${formattedPeriod}-${paddedSeq}`);
    } else if (baseSequence !== null) {
      setSummaryNumber(String(baseSequence).padStart(3, "0"));
    }
  }, [
    clientName,
    taxPeriod,
    baseSequence,
    setSummaryNumber,
    isEditing,
    originalNumber,
  ]);

  return (
    <div className="space-y-6">
      {/* Bill Number */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
          Bill Number
        </label>
        <div className="relative group">
          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            value={summaryNumber}
            readOnly
            placeholder="Auto-generating..."
            className="pl-10 h-11 bg-stone-50/50 border-stone-200 text-stone-900 font-black rounded-lg focus-visible:ring-0 cursor-default shadow-none"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Issue Date */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
            Issue Date
          </label>
          <div className="relative group">
            <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-stone-900 transition-colors z-10" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 h-11 bg-white border-stone-200 hover:border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all rounded-lg text-stone-900 font-medium shadow-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </div>

        {/* Bill Period */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
            Bill Period
          </label>
          <div className="relative group">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-stone-900 transition-colors pointer-events-none" />
            <select
              value={taxPeriod}
              onChange={(e) => setTaxPeriod(e.target.value)}
              className="w-full h-11 rounded-lg border border-stone-200 bg-white hover:border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all appearance-none pl-10 pr-10 text-stone-900 font-medium cursor-pointer shadow-none"
            >
              {taxPeriodOptions.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="h-4 w-4 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
