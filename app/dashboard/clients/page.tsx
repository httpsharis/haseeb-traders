"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Users, X, Check, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// 1. Updated Interface to support dynamic status
interface Client {
  _id: string;
  name: string;
  completionRate?: number; // Mock data for progress
  status?: "Active" | "Inactive"; // Mock data for badge
}

// 2. Extracted Progress Component
const ClientProgress = ({ value = 0 }: { value?: number }) => (
  <div className="flex items-center gap-3 w-32">
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full bg-[#ea580c] transition-all duration-500 ease-in-out"
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-xs font-medium text-slate-500 w-8">{value}%</span>
  </div>
);

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

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      const result = await res.json();

      // Injecting mock data for the visual upgrade. 
      // In production, your API should return these fields.
      const enhancedData = (result.data || []).map((c: Client) => ({
        ...c,
        completionRate: Math.floor(Math.random() * 60) + 40, // Random 40-100%
        status: Math.random() > 0.2 ? "Active" : "Inactive"
      }));
      setClients(enhancedData);
    } catch {
      console.error("Failed to fetch clients");
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAdd = async () => { /* ... existing logic ... */ };
  const handleUpdate = async (id: string) => { /* ... existing logic ... */ };
  const handleDelete = async (id: string) => { /* ... existing logic ... */ };

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Client Info</h1>
          <p className="mt-1 text-slate-500">Manage directory, track progress, and update details.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-[#ea580c] hover:bg-[#c2410c] shadow-sm">
          <Plus className="size-4" /> Add New Client
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Clean Header with Search integrated naturally */}
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-[#ea580c]" />
              <CardTitle className="text-lg text-slate-800">
                {loading ? "Loading Directory..." : `Active Directory (${clients.length})`}
              </CardTitle>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-slate-200 focus-visible:ring-[#ea580c]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="w-16 text-center">ID</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Project Progress</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading Skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-2 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                // Empty State
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <Activity className="size-8 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-900">No clients found</p>
                    <p className="text-sm">{search ? "Try adjusting your search terms." : "Add your first client to get started."}</p>
                  </TableCell>
                </TableRow>
              ) : (
                // Data Rows
                clients.map((client, idx) => (
                  <TableRow key={client._id} className="hover:bg-slate-50 transition-colors group">
                    <TableCell className="text-slate-400 text-sm text-center font-medium">
                      {(idx + 1).toString().padStart(2, '0')}
                    </TableCell>

                    <TableCell>
                      {editId === client._id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 max-w-[200px] bg-white border-[#ea580c] focus-visible:ring-1 focus-visible:ring-[#ea580c]"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleUpdate(client._id)}
                          />
                          <Button size="icon" variant="ghost" className="size-8 text-green-600 hover:bg-green-50" onClick={() => handleUpdate(client._id)}>
                            <Check className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="size-8 text-slate-400 hover:bg-slate-100" onClick={() => setEditId(null)}>
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-900">{client.name}</span>
                      )}
                    </TableCell>

                    {/* Dynamic Status Badge */}
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${client.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-600"
                        }`}>
                        {client.status}
                      </span>
                    </TableCell>

                    {/* Dynamic Progress Bar */}
                    <TableCell>
                      <ClientProgress value={client.completionRate} />
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      {editId !== client._id && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {deleteId === client._id ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                              <span className="text-xs font-medium text-red-600 mr-2">Sure?</span>
                              <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(client._id)}>
                                Yes
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={() => setDeleteId(null)}>
                                No
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-slate-400 hover:text-[#ea580c] hover:bg-orange-50"
                                onClick={() => { setEditId(client._id); setEditName(client.name); }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal remains mostly the same, just keeping the styling consistent */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md mx-4 shadow-xl">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-xl">Add New Client</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company / Client Name</label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="focus-visible:ring-[#ea580c]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setShowAdd(false); setNewName(""); }}>Cancel</Button>
                <Button onClick={handleAdd} disabled={saving || !newName.trim()} className="bg-[#ea580c] hover:bg-[#c2410c]">
                  {saving ? "Adding..." : "Save Client"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}