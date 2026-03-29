"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Tags, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch categories");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewName("");
      setShowAdd(false);
      fetchCategories();
    } catch {
      alert("Failed to add category. Name may already exist.");
    }
    setSaving(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditId(null);
      fetchCategories();
    } catch {
      alert("Failed to update category.");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchCategories();
    } catch {
      alert("Failed to toggle category.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      setDeleteId(null);
      fetchCategories();
    } catch {
      alert("Failed to delete category.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your product and service categories</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-[#ea580c] hover:bg-[#c2410c]">
          <Plus className="size-4" /> Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
      </div>

      {/* Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <Tags className="size-5 text-[#ea580c]" />
            <CardTitle className="text-base text-slate-800">
              {loading ? "Loading..." : `${filtered.length} Categor${filtered.length !== 1 ? "ies" : "y"}`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    {search ? "No categories match your search." : "No categories yet. Add your first one above."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((cat, idx) => (
                  <TableRow key={cat._id}>
                    <TableCell className="text-slate-500 text-sm">{idx + 1}</TableCell>
                    <TableCell>
                      {editId === cat._id ? (
                        <div className="flex items-center gap-2">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 max-w-xs" autoFocus onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat._id)} />
                          <Button size="icon" variant="ghost" className="size-7 text-green-600" onClick={() => handleUpdate(cat._id)}><Check className="size-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400" onClick={() => setEditId(null)}><X className="size-3.5" /></Button>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-900">{cat.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={cat.isActive ? "default" : "secondary"} className={cat.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-500"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editId !== cat._id && (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-blue-600" onClick={() => handleToggle(cat._id, cat.isActive)} title={cat.isActive ? "Deactivate" : "Activate"}>
                            {cat.isActive ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-[#ea580c]" onClick={() => { setEditId(cat._id); setEditName(cat.name); }}>
                            <Pencil className="size-3.5" />
                          </Button>
                          {deleteId === cat._id ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete(cat._id)}>Confirm</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDeleteId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button size="icon" variant="ghost" className="size-7 text-slate-400 hover:text-red-600" onClick={() => setDeleteId(cat._id)}>
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
            <CardHeader><CardTitle>Add New Category</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="e.g. Construction, Electronics..." value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowAdd(false); setNewName(""); }}>Cancel</Button>
                <Button onClick={handleAdd} disabled={saving || !newName.trim()} className="bg-[#ea580c] hover:bg-[#c2410c]">{saving ? "Adding..." : "Add Category"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
