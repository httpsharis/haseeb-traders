"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Moon, Settings as SettingsIcon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [isDark, setIsDark] = useState(false);

  // Read and apply current theme on mount
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (!mounted) return;
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      } else if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      } else {
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    });
    return () => { mounted = false; };
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your application preferences</p>
      </div>

      {/* Shop Info */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-[#ea580c]" />
            <CardTitle className="text-base text-slate-800 dark:text-slate-200">Shop Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Business Name</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Haseeb Traders</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Location</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">House 139, Street 3, Gareebabad Khanewal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">System</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Billing & Invoice Management</span>
          </div>
        </CardContent>
      </Card>

      {/* Theme Toggle */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-slate-50/50 pb-4 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <SettingsIcon className="size-5 text-[#ea580c]" />
            <CardTitle className="text-base text-slate-800 dark:text-slate-200">Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">Dark Mode</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Switch between light and dark theme
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isDark ? "bg-[#ea580c]" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-flex size-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                  isDark ? "translate-x-7" : "translate-x-1"
                }`}
              >
                {isDark ? <Moon className="size-3.5 text-[#ea580c]" /> : <Sun className="size-3.5 text-slate-500" />}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
