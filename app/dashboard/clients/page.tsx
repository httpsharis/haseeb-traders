"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Users, X, Check, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  _id: string;
  name?: string;
  companyName?: string;
  completionRate?: number; 
  status?: "Active" | "Inactive"; 
}

function extractData<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null) {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data as T[];
    if (Array.isArray(d.docs)) return d.docs as T[];
  }
  return [];
}

const ClientProgress = ({ value = 0 }: { value?: number }) => (
  <div className="flex items-center gap-3 w-full max-w-[140px]">
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full bg-[#ea580c] transition-all duration-500 ease-in-out"
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-xs font-bold text-slate-500 w-8">{value}%</span>
  </div>
);

const Avatar = ({ name }: { name: string }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
      <span className="text-lg font-black text-[#ea580c]">{initial}</span>
    </div>
  );
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?t=${Date.now()}`);
      const data = await res.json();

      const extracted = extractData<Client>(data);
      
      const enhancedData = extracted.map((c) => ({
        ...c,
        completionRate: c.completionRate ?? Math.floor(Math.random() * 60) + 40, 
        status: c.status ?? (Math.random() > 0.2 ? "Active" : "Inactive")
      }));
      
      setClients(enhancedData);
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(c => 
      (c.name || "").toLowerCase().includes(q) || 
      (c.companyName || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newName, 
          companyName: newName
        }),
      });
      if (res.ok) {
        setNewName("");
        setShowAdd(false);
        fetchClients();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/clients`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id, name: editName }),
      });
      if (res.ok) {
        setEditId(null);
        fetchClients();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clients?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteId(null);
        fetchClients();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto pb-32 space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Client Directory</h1>
          <p className="mt-1 font-medium text-slate-500">Manage your active clients and track project progress.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 h-12 px-8 bg-[#ea580c] hover:bg-[#d44d0a] shadow-md shadow-orange-500/10 font-black rounded-xl text-base transition-all shrink-0">
          <Plus className="size-5" /> Add Client
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b bg-slate-50/50 pb-5 pt-6 px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                <Users className="size-5 text-[#ea580c]" />
              </div>
              <CardTitle className="text-xl font-black text-slate-800">
                {loading ? "Loading Directory..." : `Active Directory (${filteredClients.length})`}
              </CardTitle>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-[#ea580c] rounded-xl font-medium shadow-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100">
                  <TableHead className="w-[45%] text-xs font-black text-slate-500 uppercase tracking-widest py-5 px-6 pl-8">Client Name</TableHead>
                  <TableHead className="w-[20%] text-xs font-black text-slate-500 uppercase tracking-widest py-5 px-6">Status</TableHead>
                  <TableHead className="w-[20%] text-xs font-black text-slate-500 uppercase tracking-widest py-5 px-6">Progress</TableHead>
                  <TableHead className="w-[15%] text-right text-xs font-black text-slate-500 uppercase tracking-widest py-5 px-6 pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-8 py-5 flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell className="px-6 py-5"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="px-6 py-5"><Skeleton className="h-2 w-28 rounded-full" /></TableCell>
                      <TableCell className="px-6 py-5 pr-8"><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center text-slate-500">
                      <Activity className="size-10 mx-auto mb-4 text-slate-300" />
                      <p className="font-black text-slate-900 text-lg">No clients found</p>
                      <p className="text-sm font-medium mt-1 text-slate-500">{search ? "Try adjusting your search terms." : "Add your first client to get started."}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const displayName = client.name || client.companyName || "Unknown Client";
                    
                    return (
                    <TableRow key={client._id} className="hover:bg-slate-50/50 transition-colors group">
                      
                      <TableCell className="py-4 pl-8 pr-6">
                        <div className="flex items-center gap-4">
                          <Avatar name={displayName} />
                          {editId === client._id ? (
                            <div className="flex items-center gap-2 animate-in fade-in">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-9 max-w-[200px] bg-white border-[#ea580c] focus-visible:ring-2 focus-visible:ring-orange-200 font-bold"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleUpdate(client._id)}
                              />
                              <Button size="icon" variant="ghost" className="size-9 text-emerald-600 hover:bg-emerald-50 rounded-lg shrink-0" onClick={() => handleUpdate(client._id)}>
                                <Check className="size-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="size-9 text-slate-400 hover:bg-slate-100 rounded-lg shrink-0" onClick={() => setEditId(null)}>
                                <X className="size-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 text-base">{displayName}</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black border uppercase tracking-wider ${
                          client.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                          {client.status}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-6">
                        <ClientProgress value={client.completionRate} />
                      </TableCell>

                      <TableCell className="text-right px-6 py-4 pr-8">
                        {editId !== client._id && (
                          <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {deleteId === client._id ? (
                              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                                <Button size="sm" className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm" disabled={isDeleting} onClick={() => handleDelete(client._id)}>
                                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 text-xs font-bold bg-white text-slate-600 rounded-md shadow-sm" disabled={isDeleting} onClick={() => setDeleteId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-9 text-slate-400 hover:text-[#ea580c] hover:bg-orange-50 rounded-lg transition-colors"
                                  onClick={() => { setEditId(client._id); setEditName(displayName); }}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  onClick={() => setDeleteId(client._id)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Upgraded snappy modal animation */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150 ease-out">
          <Card className="w-full max-w-md mx-4 shadow-2xl border-0 ring-1 ring-slate-900/5 animate-in zoom-in-95 fade-in duration-150 ease-out">
            <CardHeader className="border-b border-slate-100 bg-white rounded-t-2xl px-8 py-6">
              <CardTitle className="text-2xl font-black text-slate-900">Add New Client</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-5 bg-slate-50 rounded-b-2xl">
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Client Name</label>
                <Input
                  placeholder="e.g. Haseeb Traders"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="bg-white focus-visible:ring-[#ea580c] focus-visible:border-[#ea580c] h-12 border-slate-200 rounded-xl font-medium shadow-sm text-base"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" className="font-bold text-slate-600 border-slate-200 h-11 px-6 rounded-xl hover:bg-slate-100" onClick={() => { setShowAdd(false); setNewName(""); }}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={saving || !newName.trim()} className="bg-[#ea580c] hover:bg-[#d44d0a] font-black h-11 px-8 rounded-xl shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {saving ? "Saving..." : "Save Client"}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}