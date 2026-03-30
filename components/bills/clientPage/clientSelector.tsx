"use client";

import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddClientPopup } from "./addClientPopup";

interface Client {
    _id: string;
    name: string;
}

interface ClientSelectorProps {
    selectedName: string;
    onSelect: (id: string, name: string) => void;
}

export function ClientSelector({ selectedName, onSelect }: ClientSelectorProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(selectedName || "");
    const [showDropdown, setShowDropdown] = useState(false);

    // We only need to know if the popup is open or closed now
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
        setActiveIndex(-1);
    }, [searchQuery]);

    const filtered = clients.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // New function to handle data returning from the popup
    const handleClientCreated = (newClient: Client) => {
        setClients([...clients, newClient]);
        onSelect(newClient._id, newClient.name);
        setSearchQuery(newClient.name);
        setShowNewClient(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") e.preventDefault();
        if (!showDropdown || filtered.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter" && activeIndex >= 0) {
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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Client
            </label>
            <div className="flex gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#ea580c] transition-colors" />
                    <Input
                        placeholder="Search and select client..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowDropdown(true);
                            if (!e.target.value) onSelect("", "");
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onKeyDown={handleKeyDown}
                        className="pl-10 h-12 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all rounded-xl text-slate-900"
                    />
                </div>
                <Button
                    onClick={() => setShowNewClient(true)}
                    className="bg-[#ea580c] hover:bg-[#c2410c] h-12 w-12 p-0 shrink-0 rounded-xl shadow-sm hover:shadow-md transition-all border-0 focus-visible:ring-2 focus-visible:ring-[#ea580c] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            {showDropdown && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 p-1.5">
                    {loading ? (
                        <div className="p-3 text-sm text-slate-500">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500 text-center">No clients found. Click + to add.</div>
                    ) : (
                        filtered.map((client, index) => (
                            <button
                                key={client._id}
                                type="button"
                                onClick={() => {
                                    onSelect(client._id, client.name);
                                    setSearchQuery(client.name);
                                    setShowDropdown(false);
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${activeIndex === index
                                        ? 'bg-orange-50 text-[#ea580c]'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                {client.name}
                            </button>
                        ))
                    )}
                </div>
            )}

            {showDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />}

            {/* This is so much cleaner! */}
            {showNewClient && (
                <AddClientPopup
                    onClose={() => setShowNewClient(false)}
                    onSuccess={handleClientCreated}
                />
            )}
        </div>
    );
}