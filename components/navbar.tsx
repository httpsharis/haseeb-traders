"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// ── Navbar ──────────────────────────────────────────────
// Top bar displayed above the main content area.
// Contains: sidebar toggle, breadcrumb area, user info, and actions.
export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      {/* ── Left: sidebar toggle + separator ── */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4!" />

      {/* ── Center: page title area (can be enhanced with breadcrumbs later) ── */}
      <div className="flex-1" />

      {/* ── Right: notifications + user info + sign out ── */}
      <div className="flex items-center gap-2">
        {/* Notification bell (placeholder for future feature) */}
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Separator orientation="vertical" className="h-4!" />

        {/* User info */}
        {session?.user && (
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="size-7 rounded-full ring-1 ring-border"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {session.user.name?.charAt(0) || "U"}
              </div>
            )}
            <span className="hidden text-sm font-medium md:inline-block">
              {session.user.name}
            </span>
          </div>
        )}

        {/* Sign out button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-muted-foreground"
        >
          <LogOut className="size-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
