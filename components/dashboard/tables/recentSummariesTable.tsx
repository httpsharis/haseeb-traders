import { FileText, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Summary } from "../types";
import { formatDate } from "./utils";

interface RecentSummariesTableProps {
  summaries: Summary[];
  billCounts: Record<string, number>;
}

/**
 * RecentSummariesTable Component
 * ===============================
 * Clean table displaying recent summaries with client, bill count, and status.
 */
export function RecentSummariesTable({
  summaries,
  billCounts,
}: RecentSummariesTableProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
        <FileText className="size-10 opacity-30" />
        <p className="text-sm">No summaries found</p>
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
            <TableHead className="w-20 text-center">Bills</TableHead>
            <TableHead className="w-28 text-center">Status</TableHead>
            <TableHead className="w-24 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow key={summary._id}>
              <TableCell className="text-muted-foreground">
                {formatDate(summary.date || summary.createdAt)}
              </TableCell>
              <TableCell className="font-medium">
                {summary.client?.name || (
                  <span className="text-muted-foreground">No client</span>
                )}
              </TableCell>
              <TableCell className="text-center font-mono tabular-nums">
                {billCounts[summary._id] ?? 0}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={summary.status === "Converted" ? "default" : "secondary"}
                  className="font-medium"
                >
                  {summary.status}
                </Badge>
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
