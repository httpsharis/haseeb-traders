"use client";

import { useEffect, ReactNode, createElement } from "react";
import type { PhantomUiAttributes } from "@aejkatappaja/phantom-ui";

interface PhantomLoaderProps {
  loading: boolean;
  children: ReactNode;
  animation?: "shimmer" | "pulse" | "breathe";
}

export function PhantomLoader({
  loading,
  children,
  animation = "shimmer",
}: PhantomLoaderProps) {
  useEffect(() => {
    import("@aejkatappaja/phantom-ui");
  }, []);

  return createElement(
    "phantom-ui",
    { loading, animation } satisfies PhantomUiAttributes,
    children,
  );
}