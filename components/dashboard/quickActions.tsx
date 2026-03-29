"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface QuickActionsProps {
  onCreateBill?: () => void;
}

/**
 * QuickActions Component
 * =======================
 * Displays the primary action button for creating new bills.
 * Positioned on the right side of the header area.
 *
 * @param {Function} onCreateBill - Callback when "Create Bill" is clicked
 */
export function QuickActions({ onCreateBill }: QuickActionsProps) {
  return (
    <Button asChild className="gap-2">
      <Link href="/dashboard/bills/new">
        <Plus className="size-4" />
        Create Bill
      </Link>
    </Button>
  );
}
