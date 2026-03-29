"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Users, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  _id: string;
  name: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      const result = await res.json();
      setClients(result.data || []);
    } catch {
      console.error("Failed to fetch clients");
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewName("");
      setShowAdd(false);
      fetchClients();
    } catch {
      alert("Failed to add client. Name may already exist.");
    }
    setSaving(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditId(null);
      fetchClients();
    } catch {
      alert("Failed to update client.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      setDeleteId(null);
      fetchClients();
    } catch {
      alert("Failed to delete client.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your client directory</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-[#ea580c] hover:bg-[#c2410c]">
          <Plus className="size-4" /> Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-[#ea580c]" />
            <CardTitle className="text-base text-slate-800">
              {loading ? "Loading..." : `${clients.length} Client${clients.length !== 1 ? "s" : ""}`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                    {search ? "No clients match your search." : "No clients yet. Add your first client above."}
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client, idx) => (
                  <TableRow key={client._id}>
                    <TableCell className="text-slate-500 text-sm">{idx + 1}</TableCell>
                    <TableCell>
                      {editId === client._id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 max-w-xs"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleUpdate(client._id)}
                          />
                          <Button size="icon" variant="ghost" className="size-7 text-green-600" onClick={() => handleUpdate(client._id)}>
                            <Check className="size-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400" onClick={() => setEditId(null)}>
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-900">{client.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editId !== client._id && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-slate-400 hover:text-[#ea580c]"
                            onClick={() => { setEditId(client._id); setEditName(client.name); }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          {deleteId === client._id ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete(client._id)}>
                                Confirm
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDeleteId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-slate-400 hover:text-red-600"
                              onClick={() => setDeleteId(client._id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter client name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowAdd(false); setNewName(""); }}>Cancel</Button>
                <Button onClick={handleAdd} disabled={saving || !newName.trim()} className="bg-[#ea580c] hover:bg-[#c2410c]">
                  {saving ? "Adding..." : "Add Client"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
