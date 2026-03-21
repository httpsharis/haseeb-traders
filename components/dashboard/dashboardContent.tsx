"use client";

import { DashboardHeader } from "./dashboardHeader";
import { QuickActions } from "./quickActions";
import { StatsSection } from "./statsSection";
import { RecentDataTabs } from "./recentDataTabs";
import { useDashboardData } from "./hooks/useDashboardData";

/**
 * DashboardContent Component
 * ===========================
 * Main dashboard layout that composes all dashboard sections.
 *
 * Layout Structure:
 * ┌─────────────────────────────────────────────┐
 * │  Header (title)              [Create Bill]  │
 * ├─────────────────────────────────────────────┤
 * │  Stats Cards (2 columns)                    │
 * ├─────────────────────────────────────────────┤
 * │  Recent Data Tabs (Bills / Summaries)       │
 * └─────────────────────────────────────────────┘
 *
 * Data Flow:
 * 1. useDashboardData hook fetches all data on mount
 * 2. Stats are displayed in StatCard components
 * 3. Recent bills/summaries shown in tabbed tables
 */
export function DashboardContent() {
  const {
    stats,
    summaries,
    bills,
    billCounts,
    pagination,
    loading,
    error,
    billsPage,
    summariesPage,
    setBillsPage,
    setSummariesPage,
  } = useDashboardData();

  // Handle error state
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">Failed to load dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row: Title + Action Button */}
      <div className="flex items-center justify-between">
        <DashboardHeader />
        <QuickActions />
      </div>

      {/* Stats Section */}
      <StatsSection stats={stats} loading={loading} />

      {/* Recent Data Tables with Separate Pagination */}
      <RecentDataTabs
        bills={bills}
        summaries={summaries}
        billCounts={billCounts}
        pagination={pagination}
        loading={loading}
        billsPage={billsPage}
        summariesPage={summariesPage}
        onBillsPageChange={setBillsPage}
        onSummariesPageChange={setSummariesPage}
      />
    </div>
  );
}
