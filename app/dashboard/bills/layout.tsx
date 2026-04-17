import { BillDraftProvider } from "@/hooks/useBillDraft";

export default function NewBillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BillDraftProvider>
      <div className="min-h-screen bg-stone-50/30">{children}</div>
    </BillDraftProvider>
  );
}
