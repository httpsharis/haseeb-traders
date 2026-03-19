"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Wraps the app with all client-side providers (e.g. NextAuth session).
 *
 * WHY a separate file?
 * ─ `layout.tsx` is a Server Component by default, but `SessionProvider`
 *   needs the React context API which only works on the client.
 *   Extracting providers into a "use client" boundary keeps layout
 *   server-rendered while still providing session context to every page.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
