"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Users, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, ColumnDef } from "@/components/ui/DataPage";
import { Client } from "@/types";

export default function AllClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showAddClient, setShowAddClient] = useState(false); // ✅ Added Modal State

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/clients`);
            const data = await res.json();
            setClients(Array.isArray(data) ? data : data.data || []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchClients(); }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this client?")) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
            if (res.ok) setClients((prev) => prev.filter((c) => c._id !== id));
        } finally {
            setIsDeleting(null);
        }
    };

    const handleClientAdded = (newClient: Client) => {
        setClients(prev => [...prev, newClient]);
        setShowAddClient(false);
    };

    // ── DEFINE HOW THE COLUMNS SHOULD RENDER ──
    const clientColumns: ColumnDef<Client>[] = [
        { 
            header: "Client Name", 
            className: "font-black text-stone-900 pl-6", 
            cell: (c) => c.name 
        },
        { 
            header: "Date Added", 
            // ✅ DESIGN FIX: Added w-40 and text-xs to make it sleek and prevent stretching
            className: "font-bold text-stone-600", 
            cell: (c) => c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : <span className="text-stone-300 font-normal italic">Legacy Record</span> 
        },
        {
            header: "Actions",
            // ✅ DESIGN FIX: Locked width to 24
            className: "text-right pr-6 w-24",
            cell: (c) => (
                <div className="flex justify-end transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => handleDelete(c._id, e)}>
                        {isDeleting === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-stone-900 tracking-tight">All Clients</h1>
                    <p className="mt-1 font-medium text-stone-500">Manage your customer database.</p>
                </div>
                {/* ✅ FUNCTIONAL BUTTON */}
                <Button 
                    onClick={() => setShowAddClient(true)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
            </div>

            <DataTable 
                data={clients}
                columns={clientColumns}
                isLoading={isLoading}
                searchPlaceholder="Search clients or companies..."
                emptyIcon={<Users className="h-10 w-10 mx-auto" />}
                emptyMessage="No clients found."
                filterFn={(client, term) => 
                    (client.name || "").toLowerCase().includes(term) || 
                    (client.companyName || "").toLowerCase().includes(term)
                }
                sortOptions={[
                    { label: "Newest First", value: "NEWEST" },
                    { label: "Oldest First", value: "OLDEST" },
                    { label: "Name (A-Z)", value: "A_Z" },
                    { label: "Name (Z-A)", value: "Z_A" }
                ]}
                defaultSort="NEWEST"
                sortFn={(a, b, sortOrder) => {
                    if (sortOrder === "NEWEST") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                    if (sortOrder === "OLDEST") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                    if (sortOrder === "A_Z") return (a.name || "").localeCompare(b.name || "");
                    if (sortOrder === "Z_A") return (b.name || "").localeCompare(a.name || "");
                    return 0;
                }}
            />

            {/* ✅ INLINE MODAL POPUP */}
            {showAddClient && (
                <AddClientPopup 
                    onClose={() => setShowAddClient(false)} 
                    onSuccess={handleClientAdded} 
                />
            )}
        </div>
    );
}

// ============================================================================
// MODAL COMPONENT (Reused from Step 1)
// ============================================================================
function AddClientPopup({ onClose, onSuccess }: { onClose: () => void, onSuccess: (client: Client) => void }) {
    const [newClientName, setNewClientName] = useState("");
    const [saving, setSaving] = useState(false);

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
            onSuccess(newClient);
        } catch (err) {
            console.error("Failed to create client", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-black text-stone-900 tracking-tight">Add New Client</h2>
                        <p className="text-sm font-medium text-stone-500 mt-1">Create a new profile for your database.</p>
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
                                if (e.key === 'Enter' && newClientName.trim()) {
                                    e.preventDefault();
                                    handleCreateClient();
                                }
                            }}
                            className="h-11 w-full bg-stone-50/50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-none rounded-lg font-medium"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose} className="h-10 px-4 text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-bold rounded-lg shadow-none">
                            Cancel
                        </Button>
                        <Button onClick={handleCreateClient} disabled={saving || !newClientName.trim()} className="h-10 px-6 font-bold shadow-none rounded-lg disabled:opacity-50 bg-primary text-white hover:bg-primary/90">
                            {saving ? "Saving..." : "Save Client"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}