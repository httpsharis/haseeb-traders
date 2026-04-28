"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CreateBillActionBuilder() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateDraft = async () => {
    setLoading(true);
    try {
      // Setup a blank payload. The backend will ignore client since status is "Draft".
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Draft",
          baseAmount: 0,
          taxAmount: 0,
          amount: 0,
          items: [],
          description: "New Draft Bill",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create draft");
      }

      const draft = await res.json();
      
      // Navigate to the creation view via the fresh draft
      router.push(`/dashboard/bills/new?draftId=${draft._id}`);
    } catch (err) {
      console.error("Failed to start new draft:", err);
      // Fallback
      router.push("/dashboard/bills/new?fresh=true");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreateDraft}
      disabled={loading}
      className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-5 rounded-lg transition-all"
    >
      <Plus className="mr-2 h-4 w-4" /> {loading ? "Creating..." : "Create Bill"}
    </Button>
  );
}
