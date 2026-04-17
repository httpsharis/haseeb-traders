// app/dashboard/bills/new/page.tsx
import Step1Client from "@/components/features/bills/StepOneClient";

export const metadata = {
  title: "Create Bill - Step 1 | Haseeb Traders",
  description: "Select client and bill details",
};

export default function NewBillPage() {
  return (
    <div className="p-4 md:p-8">
      <Step1Client />
    </div>
  );
}