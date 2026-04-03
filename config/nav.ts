import {
  LayoutDashboard,
  FilePlus,
  Users,
  Clock,
  FileText,
  Tags,
  Receipt,
  Settings,
  Percent,
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
    label: "Workspace",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Create Bill", url: "/dashboard/bills/new", icon: FilePlus },
      // This is your new "Inbox/Cart" step 1
      { title: "Create Summary", url: "/dashboard/summary/new", icon: Clock }, 
    ],
  },
  {
    label: "Directories",
    items: [
      { title: "All Clients", url: "/dashboard/clients", icon: Users },
      { title: "All Bills", url: "/dashboard/bills", icon: Receipt },
      // This is your new main list
      { title: "All Summaries", url: "/dashboard/summary", icon: FileText }, 
    ],
  },
  {
    label: "Master Settings",
    items: [
      { title: "Categories", url: "/dashboard/categories", icon: Tags },
      { title: "Tax Rules", url: "/dashboard/tax-rules", icon: Percent },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];