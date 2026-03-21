import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

/**
 * StatCard Component
 * ===================
 * Displays a single statistic with an icon, label, and value.
 * Used in the dashboard to show key metrics like total bills/summaries.
 *
 * @param {LucideIcon} icon - The Lucide icon component to display
 * @param {string} label - Descriptive label for the stat
 * @param {string|number} value - The numeric or text value to display
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon={Receipt}
 *   label="Total Bills"
 *   value={150}
 * />
 * ```
 */
export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
