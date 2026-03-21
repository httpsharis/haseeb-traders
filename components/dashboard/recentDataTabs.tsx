"use client";

import { FileText, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecentBillsTable, RecentSummariesTable } from "./tables";
import type { Bill, Summary, Pagination } from "./types";

interface RecentDataTabsProps {
  bills: Bill[];
  summaries: Summary[];
  billCounts: Record<string, number>;
  pagination: Pagination | null;
  loading: boolean;
  billsPage: number;
  summariesPage: number;
  onBillsPageChange: (page: number) => void;
  onSummariesPageChange: (page: number) => void;
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-6">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

/**
 * PaginationControls Component
 */
function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * RecentDataTabs Component
 * Tabbed interface with separate pagination for bills and summaries.
 */
export function RecentDataTabs({
  bills,
  summaries,
  billCounts,
  pagination,
  loading,
  billsPage,
  summariesPage,
  onBillsPageChange,
  onSummariesPageChange,
}: RecentDataTabsProps) {
  return (
    <Card>
      <Tabs defaultValue="bills">
        <CardHeader className="pb-0">
          <TabsList>
            <TabsTrigger value="bills" className="gap-2">
              <Receipt className="size-4" />
              Recent Bills
              {pagination && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({pagination.totalBills})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="summaries" className="gap-2">
              <FileText className="size-4" />
              Recent Summaries
              {pagination && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({pagination.totalSummaries})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="pt-4">
          <TabsContent value="bills" className="m-0 space-y-4">
            {loading ? <LoadingSkeleton /> : <RecentBillsTable bills={bills} />}
            {!loading && pagination && pagination.totalBillPages > 1 && (
              <PaginationControls
                page={billsPage}
                totalPages={pagination.totalBillPages}
                onPageChange={onBillsPageChange}
              />
            )}
          </TabsContent>

          <TabsContent value="summaries" className="m-0 space-y-4">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <RecentSummariesTable summaries={summaries} billCounts={billCounts} />
            )}
            {!loading && pagination && pagination.totalSummaryPages > 1 && (
              <PaginationControls
                page={summariesPage}
                totalPages={pagination.totalSummaryPages}
                onPageChange={onSummariesPageChange}
              />
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
