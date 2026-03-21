import { FileText, Receipt } from "lucide-react";
import { StatCard } from "./statCard";
import type { DashboardStats } from "./types";

interface StatsSectionProps {
  stats: DashboardStats | null;
  loading: boolean;
}

/**
 * StatsSection Component
 * =======================
 * Container for displaying dashboard statistics in a responsive grid.
 * Shows loading placeholder when data is being fetched.
 *
 * @param {DashboardStats|null} stats - The stats object or null if not loaded
 * @param {boolean} loading - Whether data is currently being fetched
 */
export function StatsSection({ stats, loading }: StatsSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StatCard
        icon={Receipt}
        label="Total Bills"
        value={loading ? "—" : (stats?.totalBills ?? 0)}
      />
      <StatCard
        icon={FileText}
        label="Total Summaries"
        value={loading ? "—" : (stats?.totalSummaries ?? 0)}
      />
    </div>
  );
}
