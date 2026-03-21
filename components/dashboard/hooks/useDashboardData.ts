"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardData, DashboardStats, Summary, Bill, Pagination } from "../types";

/**
 * useDashboardData Hook
 * ======================
 * Custom hook with separate pagination for bills and summaries.
 */
export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billCounts, setBillCounts] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Separate page state for bills and summaries
  const [billsPage, setBillsPage] = useState(1);
  const [summariesPage, setSummariesPage] = useState(1);

  /**
   * Fetches data with separate pagination for bills and summaries
   */
  const fetchRecentData = useCallback(async (bPage: number, sPage: number) => {
    try {
      const res = await fetch(
        `/api/dashboard/recent?billsPage=${bPage}&summariesPage=${sPage}&limit=5`
      );
      if (!res.ok) throw new Error("Failed to fetch recent data");

      const json = await res.json();
      setBills(json.bills || []);
      setSummaries(json.summaries || []);
      setBillCounts(json.billCounts || {});
      setPagination(json.pagination || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }, []);

  /**
   * Initial fetch - stats + recent data
   */
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setError(null);

        const [statsRes, recentRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/recent?billsPage=1&summariesPage=1&limit=5"),
        ]);

        if (!statsRes.ok || !recentRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const [statsJson, recentJson] = await Promise.all([
          statsRes.json(),
          recentRes.json(),
        ]);

        setStats(statsJson);
        setBills(recentJson.bills || []);
        setSummaries(recentJson.summaries || []);
        setBillCounts(recentJson.billCounts || {});
        setPagination(recentJson.pagination || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  /**
   * Re-fetch when either page changes (after initial load)
   */
  useEffect(() => {
    if (!loading) {
      fetchRecentData(billsPage, summariesPage);
    }
  }, [billsPage, summariesPage, loading, fetchRecentData]);

  return {
    stats,
    summaries,
    bills,
    billCounts,
    pagination,
    loading,
    error,
    billsPage,
    summariesPage,
    setBillsPage,
    setSummariesPage,
  };
}
