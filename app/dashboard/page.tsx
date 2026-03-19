import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await getServerSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <h1 className="text-3xl font-bold text-foreground">
                    Haseeb Traders Dashboard
                </h1>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <p className="text-lg text-card-foreground">
                        Welcome back, {session.user?.name}.
                    </p>
                    <p className="mt-2 text-muted-foreground">
                        Your billing system is ready for new invoices.
                    </p>
                </div>
            </div>
        </div>
    );
}