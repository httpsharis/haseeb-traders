"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, Clock, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BillDetailsProps {
    clientName: string;
    summaryNumber: string;
    setSummaryNumber: (val: string) => void;
    date: string;
    setDate: (val: string) => void;
    taxPeriod: string;
    setTaxPeriod: (val: string) => void;
}

export function BillDetailsForm({
    clientName, summaryNumber, setSummaryNumber, date, setDate, taxPeriod, setTaxPeriod
}: BillDetailsProps) {

    const [baseSequence, setBaseSequence] = useState<number | null>(null);

    // 1. Generate tax periods perfectly
    const taxPeriodOptions = useMemo(() => {
        const options: string[] = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            options.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
        }
        return options;
    }, []);

    // Set default period
    useEffect(() => {
        if (!taxPeriod && taxPeriodOptions.length > 0) {
            setTaxPeriod(taxPeriodOptions[0]);
        }
    }, [taxPeriod, taxPeriodOptions, setTaxPeriod]);

    // 2. Fetch the true sequence number from database
    useEffect(() => {
        if (baseSequence === null) {
            fetch("/api/summaries?limit=1")
                .then((res) => res.json())
                .then((result) => {
                    const lastNum = result.data?.[0]?.summaryNumber;
                    // Extract the last 3 digits if it is a formatted string
                    const match = String(lastNum).match(/\d{3}$/);
                    const parsed = match ? parseInt(match[0], 10) : 0;
                    setBaseSequence(isNaN(parsed) ? 1 : parsed + 1);
                })
                .catch(() => setBaseSequence(1));
        }
    }, [baseSequence]);

    // 3. Auto-format the Bill Number
    useEffect(() => {
        if (baseSequence !== null && clientName && taxPeriod) {
            // Get initials (e.g. "Haseeb Traders" -> "HT")
            const initials = clientName.split(" ").map(w => w[0]).join("").substring(0, 3).toUpperCase();

            // Format Period (e.g. "Mar 2026" -> "MAR26")
            const [month, year] = taxPeriod.split(" ");
            const formattedPeriod = `${month.toUpperCase()}${year.substring(2)}`;

            // Pad number (e.g. 1 -> "001")
            const paddedSeq = String(baseSequence).padStart(3, "0");

            setSummaryNumber(`${initials}-${formattedPeriod}-${paddedSeq}`);
        } else if (baseSequence !== null) {
            setSummaryNumber(String(baseSequence).padStart(3, "0"));
        }
    }, [clientName, taxPeriod, baseSequence, setSummaryNumber]);

    return (
        <div className="space-y-8 pt-8 border-t border-slate-100">
            <div className="grid sm:grid-cols-2 gap-8">

                {/* Sleek Bill Number */}
                <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bill #</label>
                    <div className="relative group">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={summaryNumber}
                            readOnly
                            className="pl-10 h-12 bg-slate-50 border-slate-200 text-[#ea580c] font-bold rounded-xl focus-visible:ring-0 cursor-default"
                        />
                    </div>
                </div>

                {/* Sleek Date Picker */}
                <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Date</label>
                    <div className="relative group">
                        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#ea580c] transition-colors z-10" />
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="pl-10 pr-4 h-12 bg-white border-slate-200 hover:border-slate-300 focus:border-[#ea580c] focus:ring-2 focus:ring-[#ea580c]/20 transition-all rounded-xl text-slate-900 font-medium [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                    </div>
                </div>

            </div>

            {/* Sleek Dropdown */}
            <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tax Period</label>
                <div className="relative group">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#ea580c] transition-colors pointer-events-none" />
                    <select
                        value={taxPeriod}
                        onChange={(e) => setTaxPeriod(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all appearance-none pl-10 pr-10 text-slate-900 font-medium cursor-pointer"
                    >
                        {taxPeriodOptions.map((period) => (
                            <option key={period} value={period}>{period}</option>
                        ))}
                    </select>
                    {/* Custom Dropdown Arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}