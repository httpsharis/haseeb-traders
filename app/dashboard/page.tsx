// ── Dashboard Page ──────────────────────────────────────
// The main dashboard overview. Auth is handled by the parent layout.
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your billing management system.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-card-foreground">
          Your billing system is ready. Use the sidebar to navigate between
          Summaries, Clients, Tax Types, and Categories.
        </p>
      </div>
    </div>
  );
}