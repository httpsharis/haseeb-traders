"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Tags, Loader2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, ColumnDef } from "@/components/ui/DataPage";

// Adjust to match your exact Category schema
export interface Category {
    _id: string;
    name: string;
    description?: string;
    createdAt?: string;
}

export default function AllCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showAddCategory, setShowAddCategory] = useState(false);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/categories`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : data.data || []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this category?")) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) setCategories((prev) => prev.filter((c) => c._id !== id));
        } finally {
            setIsDeleting(null);
        }
    };

    const handleCategoryAdded = (newCategory: Category) => {
        setCategories(prev => [...prev, newCategory]);
        setShowAddCategory(false);
    };

    // ── DEFINE HOW THE COLUMNS SHOULD RENDER ──
    const categoryColumns: ColumnDef<Category>[] = [
        { 
            header: "Category Name", 
            className: "font-black text-stone-900 pl-6", 
            cell: (c) => (
                <div className="flex items-center">
                    <Bookmark className="w-4 h-4 mr-2 text-primary/60" />
                    {c.name}
                </div>
            )
        },
        { 
            header: "Description", 
            className: "font-medium text-stone-600", 
            cell: (c) => c.description || <span className="text-stone-300 font-normal italic">No description</span> 
        },
        { 
            header: "Date Added", 
            className: "text-stone-500 font-medium text-xs w-40", 
            cell: (c) => c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : <span className="text-stone-300 font-normal italic">Legacy Record</span> 
        },
        {
            header: "Actions",
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
                    <h1 className="text-3xl font-black text-stone-900 tracking-tight">Categories</h1>
                    <p className="mt-1 font-medium text-stone-500">Manage item classifications for your bills.</p>
                </div>
                <Button 
                    onClick={() => setShowAddCategory(true)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
            </div>

            <DataTable 
                data={categories}
                columns={categoryColumns}
                isLoading={isLoading}
                searchPlaceholder="Search categories..."
                emptyIcon={<Tags className="h-10 w-10 mx-auto" />}
                emptyMessage="No categories found."
                filterFn={(category, term) => 
                    (category.name || "").toLowerCase().includes(term) || 
                    (category.description || "").toLowerCase().includes(term)
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

            {/* INLINE MODAL POPUP */}
            {showAddCategory && (
                <AddCategoryPopup 
                    onClose={() => setShowAddCategory(false)} 
                    onSuccess={handleCategoryAdded} 
                />
            )}
        </div>
    );
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================
function AddCategoryPopup({ onClose, onSuccess }: { onClose: () => void, onSuccess: (cat: Category) => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), description: description.trim() }),
            });
            const newCat = await res.json();
            onSuccess(newCat);
        } catch (err) {
            console.error("Failed to create category", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-stone-100 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-black text-stone-900 tracking-tight">Add New Category</h2>
                        <p className="text-sm font-medium text-stone-500 mt-1">Create a new classification tag.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Category Name</label>
                            <Input
                                placeholder="e.g. Labor, Materials, Logistics"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                className="h-11 w-full bg-stone-50/50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-none rounded-lg font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Description (Optional)</label>
                            <Input
                                placeholder="Brief explanation of this category..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && name.trim()) {
                                        e.preventDefault();
                                        handleCreate();
                                    }
                                }}
                                className="h-11 w-full bg-stone-50/50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-none rounded-lg font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose} className="h-10 px-4 text-stone-500 hover:text-stone-900 hover:bg-stone-100 font-bold rounded-lg shadow-none">
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={saving || !name.trim()} className="h-10 px-6 font-bold shadow-none rounded-lg disabled:opacity-50 bg-primary text-white hover:bg-primary/90">
                            {saving ? "Saving..." : "Save Category"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}