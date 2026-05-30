"use client";

import * as React from "react";
import type { Brand, Category, Coupon, Product } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initial: Coupon[];
  categories: Category[];
  products: Product[];
  brands: Brand[];
};

export default function CouponsAdmin({ initial, categories, products, brands }: Props) {
  const supabase = React.useMemo(() => createClient(), []);
  const [items, setItems] = React.useState(initial);
  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [discountType, setDiscountType] = React.useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = React.useState("10");
  const [minOrder, setMinOrder] = React.useState("0");
  const [maxDiscount, setMaxDiscount] = React.useState("");
  const [appliesTo, setAppliesTo] = React.useState<"all" | "category" | "product" | "brand">("all");
  const [targetId, setTargetId] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [usageLimit, setUsageLimit] = React.useState("");

  const refresh = React.useCallback(async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setItems((data as unknown as Coupon[]) ?? []);
  }, [supabase]);

  const addCoupon = async () => {
    const payload = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: Number(minOrder || 0),
      max_discount_amount: maxDiscount ? Number(maxDiscount) : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      applies_to: appliesTo,
      category_id: appliesTo === "category" ? targetId || null : null,
      product_id: appliesTo === "product" ? targetId || null : null,
      brand_id: appliesTo === "brand" ? targetId || null : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: true,
    };
    if (!payload.code || !payload.discount_value) return;
    await supabase.from("coupons").insert(payload);
    setCode("");
    setDescription("");
    setTargetId("");
    await refresh();
  };

  const toggleActive = async (coupon: Coupon) => {
    await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    await refresh();
  };

  const removeCoupon = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon ${coupon.code}?`)) return;
    await supabase.from("coupons").delete().eq("id", coupon.id);
    await refresh();
  };

  const targetOptions =
    appliesTo === "category" ? categories : appliesTo === "product" ? products : appliesTo === "brand" ? brands : [];

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <section className="admin-panel p-5">
        <div className="admin-section-title">Create Coupon</div>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <Label>Code</Label>
            <Input className="admin-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAVE10" />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea className="admin-input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Discount type</Label>
              <select className="admin-input h-11" value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "flat")}>
                <option value="percent">Percent</option>
                <option value="flat">Flat</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Value</Label>
              <Input className="admin-input" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Min order</Label>
              <Input className="admin-input" type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Max discount</Label>
              <Input className="admin-input" type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Applies to</Label>
            <select className="admin-input h-11" value={appliesTo} onChange={(e) => { setAppliesTo(e.target.value as typeof appliesTo); setTargetId(""); }}>
              <option value="all">All products</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
              <option value="brand">Brand</option>
            </select>
          </div>
          {appliesTo !== "all" && (
            <div className="grid gap-2">
              <Label>Target</Label>
              <select className="admin-input h-11" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">Choose target</option>
                {targetOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Expiry</Label>
              <Input className="admin-input" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Usage limit</Label>
              <Input className="admin-input" type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
            </div>
          </div>
          <Button onClick={addCoupon}>Create coupon</Button>
        </div>
      </section>

      <section className="admin-panel p-5">
        <div className="admin-section-title">Coupons</div>
        <div className="mt-4 space-y-3">
          {items.map((coupon) => (
            <div key={coupon.id} className="admin-list-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-slate-950">{coupon.code}</div>
                <div className="text-sm text-slate-500">
                  {coupon.discount_type === "percent" ? `${coupon.discount_value}%` : `Flat ${coupon.discount_value}`} off · {coupon.applies_to}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Used {coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""} · {coupon.is_active ? "Active" : "Inactive"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleActive(coupon)}>{coupon.is_active ? "Disable" : "Enable"}</Button>
                <Button variant="destructive" size="sm" onClick={() => removeCoupon(coupon)}>Delete</Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-slate-500">No coupons yet.</div>}
        </div>
      </section>
    </div>
  );
}

