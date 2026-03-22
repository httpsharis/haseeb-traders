"use client";

import { WizardProvider } from "@/components/bills";

export default function BillsLayout({ children }: { children: React.ReactNode }) {
  return <WizardProvider>{children}</WizardProvider>;
}
