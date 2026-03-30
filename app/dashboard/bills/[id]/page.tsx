"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useWizard } from "@/components/bills";

export default function EditBillPage() {
    const router = useRouter();
    const params = useParams();
    const { setData } = useWizard();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const billId = params.id as string;
        if (!billId) return;

        const fetchBill = async () => {
            try {
                // Fetch the entire Invoice (Summary + Bills)
                const res = await fetch(`/api/summaries/${billId}`);
                if (!res.ok) throw new Error("Failed to load invoice");

                const rawResponse = await res.json();
                const summaryObj = rawResponse.summary || rawResponse;
                const itemsList = rawResponse.bills || rawResponse.items || [];

                // Proper Mapping: Extract parent data from summaryObj, items from itemsList
                setData({
                    clientId: summaryObj.client?._id || summaryObj.client || "existing-client",
                    clientName: summaryObj.client?.name || "Unknown Client",
                    taxPeriod: summaryObj.taxPeriod || "",
                    summaryNumber: summaryObj.summaryNumber || "",
                    date: summaryObj.date ? new Date(summaryObj.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    items: itemsList.map((item: any) => ({
                        ...item,
                        id: item._id || item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2)}`
                    })),

                    // New fields required by TypeScript
                    summaryTaxes: summaryObj.summaryTaxes || [],
                    discount: summaryObj.discount || 0,
                    commission: summaryObj.commission || 0
                });

                router.push("/dashboard/bills/new/items");

            } catch (err) {
                console.error("API Error:", err);
                setError("Could not find this bill. It may have been deleted or the API route is missing.");
                setLoading(false);
            }
        };

        fetchBill();
    }, [params.id, setData, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 text-[#ea580c] animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Loading Invoice...</h2>
            </div>
        );
    }

    if (error) {
        // ... Keep your existing error UI here ...
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return null;
}