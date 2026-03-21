import { Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Bill } from "../types";
import { formatDate, formatCurrency } from "./utils";

interface RecentBillsTableProps {
  bills: Bill[];
}

/**
 * Calculates the total amount for a bill.
 * Formula: (quantity × unitPrice) + sum of all tax amounts
 */
function calculateAmount(bill: Bill): number {
  const subtotal = (bill.quantity || 0) * (bill.unitPrice || 0);
  const taxTotal = bill.taxes?.reduce((sum, tax) => sum + (tax.amount || 0), 0) || 0;
  return subtotal + taxTotal;
}

/**
 * RecentBillsTable Component
 * ===========================
 * Clean table displaying recent bills with proper alignment and spacing.
 */
export function RecentBillsTable({ bills }: RecentBillsTableProps) {
  if (bills.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Receipt className="size-10 opacity-30" />
        <p className="text-sm">No bills found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-28">Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="w-24 text-center">Bill #</TableHead>
            <TableHead className="w-32 text-right">Amount</TableHead>
            <TableHead className="w-24 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill._id}>
              <TableCell className="text-muted-foreground">
                {formatDate(bill.date || bill.createdAt)}
              </TableCell>
              <TableCell className="font-medium">
                {bill.summary?.client?.name || (
                  <span className="text-muted-foreground">No client</span>
                )}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {bill.billNumber || "—"}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatCurrency(calculateAmount(bill))}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <Printer className="size-3.5" />
                  Print
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
