"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Users, Receipt, ArrowRight, Command, X, Loader2 } from "lucide-react";

interface ClientResult {
  _id: string;
  name: string;
}

interface SummaryResult {
  _id: string;
  summaryNumber: string;
  taxPeriod: string;
  status: string;
  date: string;
  client: { _id: string; name: string } | null;
}

interface BillResult {
  _id: string;
  description: string;
  billNumber: string;
  category: string;
  quantity: number;
  unitPrice: number;
  summary: {
    _id: string;
    summaryNumber: string;
    status: string;
    client: { _id: string; name: string } | null;
  } | null;
}

interface SearchResults {
  clients: ClientResult[];
  summaries: SummaryResult[];
  bills: BillResult[];
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ clients: [], summaries: [], bills: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut: Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults({ clients: [], summaries: [], bills: [] });
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ clients: [], summaries: [], bills: [] });
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setActiveIndex(0);
      } catch {
        console.error("Search failed");
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Build flat list of all results for keyboard navigation
  const flatResults = useCallback(() => {
    const items: { type: string; id: string; action: () => void }[] = [];
    results.clients.forEach((c) => {
      items.push({ type: "client", id: c._id, action: () => navigate(`/dashboard/clients`) });
    });
    results.summaries.forEach((s) => {
      const url = s.status === "Draft" ? `/dashboard/pending-bills/${s._id}` : `/dashboard/summaries`;
      items.push({ type: "summary", id: s._id, action: () => navigate(url) });
    });
    results.bills.forEach((b) => {
      const summaryId = b.summary?._id;
      const status = b.summary?.status;
      const url = status === "Draft" && summaryId ? `/dashboard/pending-bills/${summaryId}` : `/dashboard/summaries`;
      items.push({ type: "bill", id: b._id, action: () => navigate(url) });
    });
    return items;
  }, [results]);

  const navigate = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = flatResults();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[activeIndex]?.action();
    }
  };

  const hasResults = results.clients.length > 0 || results.summaries.length > 0 || results.bills.length > 0;
  let currentFlatIndex = -1;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[15%] mx-auto w-full max-w-xl px-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          
          {/* Search Input */}
          <div className="flex items-center border-b px-4">
            <Search className="size-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search clients, bills, summaries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 bg-transparent py-4 px-3 text-base text-slate-900 placeholder:text-slate-400 outline-none"
            />
            {loading ? (
              <Loader2 className="size-4 text-slate-400 animate-spin shrink-0" />
            ) : query ? (
              <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                ESC
              </kbd>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            
            {query.length < 2 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
                  <Search className="size-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">Start typing to search across your data</p>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border bg-slate-100 px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border bg-slate-100 px-1 py-0.5 font-mono text-[10px]">↵</kbd> to select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border bg-slate-100 px-1 py-0.5 font-mono text-[10px]">esc</kbd> to close
                  </span>
                </div>
              </div>
            ) : !hasResults && !loading ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">No results found for &quot;{query}&quot;</p>
                <p className="mt-1 text-xs text-slate-400">Try a different search term</p>
              </div>
            ) : (
              <>
                {/* Clients Section */}
                {results.clients.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <Users className="size-3.5" />
                      Clients
                    </div>
                    {results.clients.map((client) => {
                      currentFlatIndex++;
                      const idx = currentFlatIndex;
                      return (
                        <button
                          key={client._id}
                          onClick={() => navigate("/dashboard/clients")}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                            activeIndex === idx ? "bg-[#ea580c]/5 text-[#ea580c]" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex size-8 items-center justify-center rounded-lg ${activeIndex === idx ? "bg-[#ea580c]/10" : "bg-slate-100"}`}>
                              <Users className="size-4" />
                            </div>
                            <span className="text-sm font-medium">{client.name}</span>
                          </div>
                          <ArrowRight className={`size-3.5 ${activeIndex === idx ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Summaries Section */}
                {results.summaries.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <FileText className="size-3.5" />
                      Summaries
                    </div>
                    {results.summaries.map((summary) => {
                      currentFlatIndex++;
                      const idx = currentFlatIndex;
                      const url = summary.status === "Draft" ? `/dashboard/pending-bills/${summary._id}` : `/dashboard/summaries`;
                      return (
                        <button
                          key={summary._id}
                          onClick={() => navigate(url)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                            activeIndex === idx ? "bg-[#ea580c]/5 text-[#ea580c]" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex size-8 items-center justify-center rounded-lg ${activeIndex === idx ? "bg-[#ea580c]/10" : "bg-slate-100"}`}>
                              <FileText className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">#{summary.summaryNumber}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  summary.status === "Draft"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                                }`}>
                                  {summary.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{summary.client?.name} • {summary.taxPeriod}</p>
                            </div>
                          </div>
                          <ArrowRight className={`size-3.5 ${activeIndex === idx ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Bills Section */}
                {results.bills.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <Receipt className="size-3.5" />
                      Bills
                    </div>
                    {results.bills.map((bill) => {
                      currentFlatIndex++;
                      const idx = currentFlatIndex;
                      const summaryId = bill.summary?._id;
                      const status = bill.summary?.status;
                      const url = status === "Draft" && summaryId ? `/dashboard/pending-bills/${summaryId}` : `/dashboard/summaries`;
                      return (
                        <button
                          key={bill._id}
                          onClick={() => navigate(url)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                            activeIndex === idx ? "bg-[#ea580c]/5 text-[#ea580c]" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex size-8 items-center justify-center rounded-lg ${activeIndex === idx ? "bg-[#ea580c]/10" : "bg-slate-100"}`}>
                              <Receipt className="size-4" />
                            </div>
                            <div>
                              <span className="text-sm font-medium">{bill.description}</span>
                              <p className="text-xs text-slate-400">
                                {bill.category && `${bill.category} • `}
                                {bill.summary?.client?.name && `${bill.summary.client.name} • `}
                                Summary #{bill.summary?.summaryNumber}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className={`size-3.5 ${activeIndex === idx ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-2.5 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Command className="size-3" />K to open
              </span>
            </div>
            <span>Universal Search</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trigger button for the navbar
export function SearchTrigger() {
  const [, setOpen] = useState(false);

  const handleClick = () => {
    // Dispatch keyboard event to trigger the dialog
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    setOpen(true);
  };

  return (
    <button
      onClick={handleClick}
      className="relative flex h-9 w-full max-w-sm items-center gap-2 rounded-full bg-slate-100/50 px-4 text-sm text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
    >
      <Search className="size-4 text-slate-400" />
      <span className="flex-1 text-left">Search documents, bills...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
        <Command className="size-2.5" />K
      </kbd>
    </button>
  );
}
