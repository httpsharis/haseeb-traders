"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <Button onClick={onCreateBill} className="gap-2">
      <Plus className="size-4" />
      Create Bill
    </Button>
  );
}
