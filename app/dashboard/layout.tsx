import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/appSidebar";
import { Navbar } from "@/components/layout/navbar";

// ── Dashboard Layout ────────────────────────────────────
// Wraps all /dashboard/* pages with the sidebar + navbar shell.
// Redirects to /login if the user is not authenticated.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      {/* ── Left: collapsible sidebar ── */}
      <AppSidebar />

      {/* ── Right: navbar + page content ── */}
      <SidebarInset>
        <Navbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
