"use client";

import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SearchDialog, SearchTrigger } from "@/components/layout/searchDialog";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">

        {/* Sidebar Toggle */}
        <SidebarTrigger className="text-slate-500 hover:text-slate-900" />

        {/* Center: Search Trigger */}
        <div className="flex flex-1 items-center px-4">
          <SearchTrigger />
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-2 pr-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100">
            <Bell className="size-4" />
          </Button>

          {session?.user && (
            <div className="ml-2 flex items-center gap-2">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={28}
                  height={28}
                  className="rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
                  {session.user.name?.charAt(0) || "U"}
                </div>
              )}
              <span className="hidden text-sm font-medium text-slate-700 md:block">
                {session.user.name}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-1 h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* Search Dialog (Portal-like, rendered at the top level) */}
      <SearchDialog />
    </>
  );
}