"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Receipt, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TaxRule {
  _id: string;
  name: string;
  percentage: number;
  isActive: boolean;
}

export default function TaxRulesPage() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPercentage, setEditPercentage] = useState("");

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tax-types");
      const data = await res.json();
      setRules(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch tax rules");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const filtered = rules.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newName.trim() || !newPercentage) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tax-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), percentage: parseFloat(newPercentage) }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewName("");
      setNewPercentage("");
      setShowAdd(false);
      fetchRules();
    } catch {
      alert("Failed to add tax rule. Name may already exist.");
    }
    setSaving(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editPercentage) return;
    try {
      const res = await fetch(`/api/tax-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), percentage: parseFloat(editPercentage) }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditId(null);
      fetchRules();
    } catch {
      alert("Failed to update tax rule.");
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/tax-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchRules();
    } catch {
      alert("Failed to toggle tax rule.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tax-types/${id}`, { method: "DELETE" });
      setDeleteId(null);
      fetchRules();
    } catch {
      alert("Failed to delete tax rule.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tax Rules</h1>
          <p className="mt-1 text-sm text-slate-500">Define default tax names and percentages</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-[#ea580c] hover:bg-[#c2410c]">
          <Plus className="size-4" /> Add Tax Rule
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search tax rules..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
      </div>

      {/* Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-[#ea580c]" />
            <CardTitle className="text-base text-slate-800">
              {loading ? "Loading..." : `${filtered.length} Tax Rule${filtered.length !== 1 ? "s" : ""}`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tax Name</TableHead>
                <TableHead className="w-28 text-right">Rate (%)</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    {search ? "No tax rules match your search." : "No tax rules yet. Add your first one above."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rule, idx) => (
                  <TableRow key={rule._id}>
                    <TableCell className="text-slate-500 text-sm">{idx + 1}</TableCell>
                    <TableCell>
                      {editId === rule._id ? (
                        <div className="flex items-center gap-2">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 w-36" autoFocus />
                          <Input type="number" value={editPercentage} onChange={(e) => setEditPercentage(e.target.value)} className="h-8 w-20" step="0.1" />
                          <Button size="icon" variant="ghost" className="size-7 text-green-600" onClick={() => handleUpdate(rule._id)}><Check className="size-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400" onClick={() => setEditId(null)}><X className="size-3.5" /></Button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-900">{rule.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editId !== rule._id && (
                        <span className="font-mono text-sm font-semibold text-slate-700">{rule.percentage}%</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={rule.isActive ? "default" : "secondary"} className={rule.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-500"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editId !== rule._id && (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-blue-600" onClick={() => handleToggle(rule._id, rule.isActive)}>
                            {rule.isActive ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-[#ea580c]" onClick={() => { setEditId(rule._id); setEditName(rule.name); setEditPercentage(String(rule.percentage)); }}>
                            <Pencil className="size-3.5" />
                          </Button>
                          {deleteId === rule._id ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete(rule._id)}>Confirm</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDeleteId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-red-600" onClick={() => setDeleteId(rule._id)}>
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

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md mx-4">
            <CardHeader><CardTitle>Add New Tax Rule</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Name</label>
                <Input placeholder="e.g. GST, Income Tax, PST..." value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Rate (%)</label>
                <Input type="number" placeholder="e.g. 18" value={newPercentage} onChange={(e) => setNewPercentage(e.target.value)} step="0.1" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowAdd(false); setNewName(""); setNewPercentage(""); }}>Cancel</Button>
                <Button onClick={handleAdd} disabled={saving || !newName.trim() || !newPercentage} className="bg-[#ea580c] hover:bg-[#c2410c]">{saving ? "Adding..." : "Add Tax Rule"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
