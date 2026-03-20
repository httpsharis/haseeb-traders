"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Wraps the app with all client-side providers.
 *
 * - SessionProvider: NextAuth session context
 * - TooltipProvider: Required by shadcn sidebar tooltips (collapsed state)
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </SessionProvider>
  );
}
