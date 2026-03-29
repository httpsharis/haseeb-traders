import {
  LayoutDashboard,
  FilePlus,
  Users,
  Clock,
  FileText,
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

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Front Desk",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Create Bill", url: "/dashboard/bills/new", icon: FilePlus },
      { title: "Clients", url: "/dashboard/clients", icon: Users },
    ],
  },
  {
    label: "Private Accounting",
    items: [
      { title: "Pending Bills", url: "/dashboard/pending-bills", icon: Clock },
      { title: "All Summaries", url: "/dashboard/summaries", icon: FileText },
    ],
  },
  {
    label: "Master Settings",
    items: [
      { title: "Categories", url: "/dashboard/categories", icon: Tags },
      { title: "Tax Rules", url: "/dashboard/tax-rules", icon: Receipt },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];
