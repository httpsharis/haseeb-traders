interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * DashboardHeader Component
 * ==========================
 * Displays the main header section of the dashboard with title and subtitle.
 *
 * @param {string} title - Main heading text (default: "Dashboard")
 * @param {string} subtitle - Descriptive text below the title
 */
export function DashboardHeader({
  title = "Dashboard",
  subtitle = "Welcome back! Here's an overview of your business.",
}: DashboardHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
