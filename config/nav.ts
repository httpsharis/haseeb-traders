import {
  LayoutDashboard,
  FileText,
  Users,
  Tags,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";

// ── Navigation item type ────────────────────────────────
export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

// ── Navigation group type ───────────────────────────────
export interface NavGroup {
  label: string;
  items: NavItem[];
}

// ── Main navigation structure ───────────────────────────
// Centralized nav config — used by the sidebar and any breadcrumbs.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Billing",
    items: [
      { title: "Summaries", url: "/dashboard/summaries", icon: FileText },
      { title: "Clients", url: "/dashboard/clients", icon: Users },
    ],
  },
  {
    label: "Configuration",
    items: [
      { title: "Tax Types", url: "/dashboard/tax-types", icon: Receipt },
      { title: "Categories", url: "/dashboard/categories", icon: Tags },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];
