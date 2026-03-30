"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface WizardFooterProps {
    onNext: () => void;
    isNextDisabled: boolean;
    nextLabel?: string;
}

export function WizardFooter({ onNext, isNextDisabled, nextLabel = "Next" }: WizardFooterProps) {
    const router = useRouter();

    return (
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100 mt-8">
            <Button
                variant="outline"
                className="px-8 h-11"
                onClick={() => router.push("/dashboard")}
            >
                Cancel
            </Button>
            <Button
                onClick={onNext}
                disabled={isNextDisabled}
                className="bg-[#ea580c] hover:bg-[#ea580c]/90 px-8 h-11 text-white"
            >
                {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}