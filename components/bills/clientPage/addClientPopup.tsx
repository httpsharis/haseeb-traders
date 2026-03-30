"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddClientPopupProps {
    onClose: () => void;
    onSuccess: (newClient: { _id: string; name: string }) => void;
}

export function AddClientPopup({ onClose, onSuccess }: AddClientPopupProps) {
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
                <div className="p-6">

                    {/* Sleek Header */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Add new client</h2>
                        <p className="text-sm text-slate-500 mt-1">Create a new profile to start generating invoices.</p>
                    </div>

                    {/* Input Area - Fixed the touching label */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Client name
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
                            className="h-11 w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#ea580c] focus-visible:border-[#ea580c] transition-all shadow-sm rounded-lg"
                        />
                    </div>

                    {/* Professional Right-Aligned Buttons */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="h-10 px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateClient}
                            disabled={saving || !newClientName.trim()}
                            className="h-10 px-6 bg-[#ea580c] hover:bg-[#c2410c] text-white font-medium shadow-sm transition-colors rounded-lg disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save client"}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}