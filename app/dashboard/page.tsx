/**
 * Dashboard Page
 * ===============
 * Server component shell that renders the client-side DashboardContent.
 * Authentication is handled by the parent layout.tsx.
 */
import { DashboardContent } from "@/components/dashboard";

export default function DashboardPage() {
  return <DashboardContent />;
}