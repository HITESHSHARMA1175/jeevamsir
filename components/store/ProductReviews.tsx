"use client";

// ============================================
// FILE: components/store/ProductReviews.tsx
// PURPOSE: Render approved reviews + (for logged-in users) a
//          "Write a review" form. Submissions are inserted with
//          status='pending' (DB trigger enforces this).
// USED IN: app/products/[slug]/page.tsx
// ============================================

import * as React from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductReview, ProductReviewStats } from "@/types";

type Props = {
  productId: string;
  stats: ProductReviewStats | null;
  initialReviews: ProductReview[];
};

function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange?: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={!onChange}
            aria-label={`Rate ${n}`}
            className="text-amber-500 disabled:cursor-default"
            onClick={() => onChange?.(n)}
          >
            <Star
              className={`h-5 w-5 ${filled ? "fill-amber-500" : "text-slate-300"}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function ProductReviews({
  productId,
  stats,
  initialReviews,
}: Props) {
  const [reviews, setReviews] = React.useState<ProductReview[]>(initialReviews);
  const [hasUser, setHasUser] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setHasUser(true);
        setUserId(u.id);
        setUserEmail(u.email ?? null);
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        setUserName(
          typeof meta.full_name === "string" ? (meta.full_name as string) : null,
        );
      } else {
        setHasUser(false);
      }
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasUser || !userId) {
      setMsg("Please log in to write a review.");
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const payload = {
        product_id: productId,
        user_id: userId,
        customer_name: userName,
        customer_email: userEmail,
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
      };
      const { error } = await supabase
        .from("product_reviews")
        .insert(payload);
      if (error) throw error;
      setTitle("");
      setBody("");
      setRating(5);
      setMsg("Thanks! Your review is pending admin approval.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const avg = Number(stats?.avg_rating ?? 0);
  const count = stats?.review_count ?? 0;

  return (
    <section className="mt-12 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[var(--text-subheading)] font-semibold tracking-tight">
            Customer Reviews
          </h2>
          {count > 0 ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <StarRow value={Math.round(avg)} />
              <span>
                <span className="font-semibold text-foreground">{avg.toFixed(1)}</span>{" "}
                · {count} review{count === 1 ? "" : "s"}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-sm text-muted-foreground">
              Be the first to review this product.
            </div>
          )}
        </div>
      </div>

      {hasUser ? (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm"
        >
          <div className="text-sm font-semibold">Write a review</div>
          <div className="space-y-2">
            <Label>Your rating</Label>
            <StarRow value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rev-title">Title (optional)</Label>
            <Input
              id="rev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Loved the fabric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rev-body">Your review</Label>
            <Textarea
              id="rev-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="What did you think?"
            />
          </div>
          {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
          <Button type="submit" variant="fk" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit review"}
          </Button>
        </form>
      ) : (
        <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          <a
            href={`/auth/login?next=/products`}
            className="font-medium text-foreground underline"
          >
            Login
          </a>{" "}
          to write a review.
        </div>
      )}

      <div className="space-y-3">
        {reviews.length === 0 && (
          <div className="rounded-2xl border bg-card p-5 text-center text-sm text-muted-foreground">
            No reviews yet.
          </div>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StarRow value={r.rating} />
                <span className="text-sm font-semibold">{r.title ?? ""}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
              </span>
            </div>
            {r.body && (
              <div className="mt-2 whitespace-pre-line text-sm text-foreground">
                {r.body}
              </div>
            )}
            {(r.customer_name || r.customer_email) && (
              <div className="mt-2 text-xs text-muted-foreground">
                — {r.customer_name ?? r.customer_email}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

ProductReviews.displayName = "ProductReviews";
