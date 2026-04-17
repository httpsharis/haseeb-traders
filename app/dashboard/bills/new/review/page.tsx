import Step3Review from "@/components/features/bills/StepThreeReview";

export const metadata = {
  title: "Review & Finalize | Haseeb Traders",
  description: "Final review of your invoice",
};

export default function ReviewBillPage() {
  return (
    <div className="p-4 md:p-8">
      <Step3Review />
    </div>
  );
}