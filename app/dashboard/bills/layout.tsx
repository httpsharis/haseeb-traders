import { BillDraftProvider } from "@/hooks/useBillDraft";
import { Suspense } from "react";

export default function NewBillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <BillDraftProvider>
        <div className="min-h-screen bg-stone-50/30">{children}</div>
      </BillDraftProvider>
    </Suspense>
  );
}
