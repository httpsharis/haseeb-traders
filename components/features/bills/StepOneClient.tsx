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

  // Reset draft when arriving fresh (e.g. clicking "Create Bill" from sidebar)
  useEffect(() => {
    if (searchParams.get("fresh") === "true") {
      resetDraft();
      // Clean up the URL so back button doesn't trigger a reset
      router.replace("/dashboard/bills/new", { scroll: false });
    }
  }, [searchParams, resetDraft, router]);

  const handleClientSelect = (id: string, name: string) => {
    updateData({ clientId: id, clientName: name });
  };

  const handleNext = () => {
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
            selectedName={data.clientName}
            onSelect={handleClientSelect}
          />
        </div>

        {/* Right Side: Bill Details Form */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-6 uppercase tracking-widest">
            <Hash className="h-4 w-4 text-stone-400" /> Bill Information
          </h3>
          <BillDetailsForm
            clientName={data.clientName}
            summaryNumber={data.summaryNumber}
            setSummaryNumber={(val) => updateData({ summaryNumber: val })}
            date={data.date}
            setDate={(val) => updateData({ date: val })}
            taxPeriod={data.taxPeriod}
            setTaxPeriod={(val) => updateData({ taxPeriod: val })}
            // ✅ Edit Shield Enabled!
            isEditing={!!data._id || (data.items && data.items.length > 0)}
            originalNumber={data.summaryNumber}
          />
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="flex justify-end pt-4 border-t border-stone-200 mt-8">
        <Button
          onClick={handleNext}
          disabled={!data.clientName || !data.summaryNumber || !data.date || !data.taxPeriod}
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
  const [prevSelectedName, setPrevSelectedName] = useState(selectedName);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Sync prop to state without cascading effects
  if (selectedName !== prevSelectedName) {
    setPrevSelectedName(selectedName);
    setSearchQuery(selectedName || "");
  }

  useEffect(() => {
    let isCurrent = true;
    const delayDebounceFn = setTimeout(() => {
      if (!isCurrent) return;
      setLoading(true);
      fetch(`/api/clients?limit=15&search=${encodeURIComponent(searchQuery || "")}`)
        .then((res) => res.json())
        .then((result) => {
          if (!isCurrent) return;
          setClients(result.data || []);
          setLoading(false);
        })
        .catch(() => {
          if (isCurrent) setLoading(false);
        });
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery]);

  const filtered = clients;
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
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowNewClient(false)} />
          <InlineAddClient
            initialName={filtered.length === 0 ? searchQuery : ""}
            onClose={() => setShowNewClient(false)}
            onSuccess={handleClientCreated}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT 2: Inline Add Client
// ============================================================================

interface InlineAddClientProps {
  initialName?: string;
  onClose: () => void;
  onSuccess: (newClient: { _id: string; name: string }) => void;
}

function InlineAddClient({
  initialName = "",
  onClose,
  onSuccess,
}: InlineAddClientProps) {
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
    <div className="absolute z-30 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-2xl overflow-hidden origin-top transform transition-all opacity-100 scale-100">
      <div className="p-4 border-b border-stone-100 bg-stone-50/80">
        <h4 className="font-black text-sm text-stone-900 tracking-tight">Add New Client</h4>
        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Quick Create Profile</p>
      </div>
      <div className="p-4 space-y-4 bg-white">
        <div>
          <Input
            autoFocus
            placeholder="e.g. Acme Corp"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newClientName.trim()) {
                e.preventDefault();
                handleCreateClient();
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            className="h-10 w-full bg-white border-stone-200 text-stone-900 placeholder:text-stone-300 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-none rounded-lg font-bold"
          />
          {errorMessage && (
            <p className="mt-2 text-[11px] font-bold text-red-600">{errorMessage}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-9 px-4 text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-bold rounded-lg shadow-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateClient}
            disabled={saving || !newClientName.trim()}
            className="h-9 px-5 text-xs font-bold shadow-md shadow-orange-500/10 rounded-lg disabled:opacity-50 bg-[#ea580c] hover:bg-[#d44d0a] text-white"
          >
            {saving ? "Saving..." : "Save Client"}
          </Button>
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
