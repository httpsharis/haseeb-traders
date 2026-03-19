"use client";

import { signIn } from "next-auth/react";
import { Building2 } from "lucide-react";

// ── Google SVG icon (inline to avoid an extra dependency) ──────────────
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" className={className}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

export default function LoginPage() {
    return (
        <main className="flex min-h-svh items-center justify-center bg-background px-4">
            {/* ── outer wrapper — keeps everything centred ── */}
            <div className="flex w-full max-w-sm flex-col items-center gap-6">

                {/* ── branding ── */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
                        <Building2 className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        Haseeb Traders
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Billing and Invoicing System
                    </p>
                </div>

                {/* ── card ── */}
                <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3
                       text-sm font-medium text-foreground
                       transition-all duration-200
                       hover:bg-accent hover:shadow-md
                       active:scale-[0.98]"
                    >
                        <GoogleIcon className="h-5 w-5 shrink-0" />
                        Continue with Google
                    </button>

                    {/* ── divider (visual only) ── */}
                    <div className="my-6 flex items-center gap-3">
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-xs uppercase tracking-widest text-muted-foreground select-none">
                            secure login
                        </span>
                        <span className="h-px flex-1 bg-border" />
                    </div>

                    <p className="text-center text-xs leading-relaxed text-muted-foreground">
                        Only authorised Google accounts can access this system.
                    </p>
                </div>

                {/* ── footer status ── */}
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
                        Secure Terminal Session
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-xs text-emerald-600">System Online</span>
                    </div>
                </div>
            </div>
        </main>
    );
}