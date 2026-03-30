"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SummaryGenerator } from "@/components/dashboard/SummaryGenerator"; // Adjust path if needed

export default function SummaryEditPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState<any>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                // Fetch the specific summary from your database
                const res = await fetch(`/api/summaries/${params.id}`);
                if (!res.ok) throw new Error("Failed to load");

                const data = await res.json();

                // Format the data so the SummaryGenerator understands it
                setSummaryData({
                    billNumber: data.summaryNumber || data.billNumber || "Unknown",
                    clientName: data.clientName || data.client?.name || "Unknown Client",
                    date: data.date ? new Date(data.date).toISOString().split('T')[0] : "N/A",
                    baseAmount: data.baseAmount || data.amount || 0,
                    itemGstAmount: data.itemGstAmount || data.taxAmount || 0,
                });
                setLoading(false);
            } catch (err) {
                console.error(err);
                // If it fails, we provide empty defaults so the page still loads
                setSummaryData({
                    billNumber: "DOC-NOT-FOUND",
                    clientName: "Unknown",
                    date: "N/A",
                    baseAmount: 0,
                    itemGstAmount: 0,
                });
                setLoading(false);
            }
        };

        if (params.id) fetchSummary();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Loading Summary...</h2>
            </div>
        );
    }

    // Load the generator we built earlier, passing in the fetched data!
    return <SummaryGenerator initialBillData={summaryData} />;
}