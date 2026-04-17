// app/dashboard/bills/new/items/page.tsx
import Step2Items from "@/components/features/bills/StepTwoItems";

export const metadata = {
  title: "Create Bill - Items | Haseeb Traders",
  description: "Add line items to your bill",
};

export default function BillItemsPage() {
  return (
    <div className="p-4 md:p-8">
      <Step2Items />
    </div>
  );
}