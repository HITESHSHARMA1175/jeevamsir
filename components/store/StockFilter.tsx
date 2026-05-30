"use client";

// ============================================
// FILE: components/store/StockFilter.tsx
// PURPOSE: Client-side filter controls for category page
// USED IN: app/category/[slug]/page.tsx
// INTERN NOTE: Add more filters here (price, tags) later.
// ============================================

import * as React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onChange: (mode: "all" | "in_stock") => void;
};

/**
 * StockFilter
 * Simple toggle between showing all vs in-stock only.
 */
export default function StockFilter({ onChange }: Props) {
  const [mode, setMode] = React.useState<"all" | "in_stock">("all");

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={mode === "all" ? "default" : "outline"}
        onClick={() => {
          setMode("all");
          onChange("all");
        }}
      >
        All
      </Button>
      <Button
        type="button"
        variant={mode === "in_stock" ? "default" : "outline"}
        onClick={() => {
          setMode("in_stock");
          onChange("in_stock");
        }}
      >
        In stock
      </Button>
    </div>
  );
}

StockFilter.displayName = "StockFilter";

