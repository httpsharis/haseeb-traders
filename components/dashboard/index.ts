/**
 * Dashboard Components - Barrel Export
 * =====================================
 * Central export file for all dashboard components.
 * Import from "@/components/dashboard" for clean imports.
 */

// Main Components
export { DashboardContent } from "./dashboardContent";
export { DashboardHeader } from "./dashboardHeader";
export { QuickActions } from "./quickActions";
export { StatCard } from "./statCard";
export { StatsSection } from "./statsSection";
export { RecentDataTabs } from "./recentDataTabs";

// Table Components
export { RecentBillsTable, RecentSummariesTable } from "./tables";

// Hooks
export { useDashboardData } from "./hooks/useDashboardData";

// Types
export type {
  DashboardStats,
  DashboardData,
  Pagination,
  Bill,
  Summary,
  Client,
} from "./types";
