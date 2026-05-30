"use client";

// ============================================
// FILE: components/admin/ReviewsAdmin.tsx
// PURPOSE: Moderate product reviews — pending/approved/rejected
//          filter chips, approve/reject/delete actions, and toast
//          feedback via sonner.
// USED IN: app/admin/reviews/page.tsx
// ============================================

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, RefreshCw, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { ProductReview, ProductReviewStatus } from "@/types";

type ProductLite = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

type Props = {
  initial: ProductReview[];
  products: ProductLite[];
};

type Filter = "all" | ProductReviewStatus;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function StarRow({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= value ? "fill-amber-500" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsAdmin({ initial, products }: Props) {
  const [rows, setRows] = React.useState<ProductReview[]>(initial);
  const [filter, setFilter] = React.useState<Filter>("pending");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const productById = React.useMemo(() => {
    const map = new Map<string, ProductLite>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows(((data as unknown) as ProductReview[]) ?? []);
  }

  async function setStatus(id: string, status: ProductReviewStatus) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("product_reviews")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Review ${status}`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteReview(id: string) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Review deleted");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const filteredRows = rows.filter(
    (row) => filter === "all" || row.status === filter,
  );

  const counts = React.useMemo(() => {
    const out: Record<Filter, number> = {
      all: rows.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    rows.forEach((row) => {
      out[row.status] += 1;
    });
    return out;
  }, [rows]);

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="admin-section-title">Moderation</div>
            <div className="admin-heading mt-1">Product reviews</div>
            <p className="admin-subtle mt-2">
              Approved reviews appear publicly on the product page and feed the
              average-rating badge. Customers see status updates in their
              account under My Reviews.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refresh()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? "border-blue-200 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"
              }`}
            >
              {f.label}
              <span
                className={`rounded-sm px-1.5 py-0.5 text-[10px] ${
                  filter === f.id
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredRows.map((row) => {
          const product = productById.get(row.product_id);
          return (
            <div key={row.id} className="admin-panel-flat p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  {product?.image_url && (
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border bg-slate-50">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {product ? (
                        <Link
                          href={`/products/${product.slug}`}
                          className="hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {product.name}
                        </Link>
                      ) : (
                        "Unknown product"
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      <StarRow value={row.rating} />{" "}
                      <span className="ml-2">
                        by {row.customer_name ?? row.customer_email ?? "Customer"}
                      </span>
                      {row.created_at && (
                        <span className="ml-2">
                          · {new Date(row.created_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {row.title && (
                      <div className="mt-2 text-sm font-semibold">{row.title}</div>
                    )}
                    {row.body && (
                      <div className="mt-1 whitespace-pre-line text-sm text-foreground/90">
                        {row.body}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="admin-status-pill">{row.status}</span>
                  {row.status !== "approved" && (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={busyId === row.id}
                      onClick={() => void setStatus(row.id, "approved")}
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                  )}
                  {row.status !== "rejected" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      disabled={busyId === row.id}
                      onClick={() => void setStatus(row.id, "rejected")}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    disabled={busyId === row.id}
                    onClick={() => void deleteReview(row.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredRows.length === 0 && (
          <div className="admin-panel-flat p-5 text-sm text-muted-foreground">
            No reviews in this filter.
          </div>
        )}
      </div>
    </div>
  );
}

ReviewsAdmin.displayName = "ReviewsAdmin";
