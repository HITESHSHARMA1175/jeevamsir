"use client";

// ============================================
// FILE: components/admin/BannersAdmin.tsx
// PURPOSE: Client CRUD UI for banners
// USED IN: app/admin/banners/page.tsx
// INTERN NOTE: Set is_active=false to hide a banner.
// ============================================

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StorageUploader from "@/components/admin/StorageUploader";
import type { Banner, Category, HomepageSection, Product } from "@/types";

type Props = {
  initial: Banner[];
  products: Product[];
  categories: Category[];
  sections: HomepageSection[];
};

export default function BannersAdmin({ initial, products, categories, sections }: Props) {
  const [rows, setRows] = React.useState<Banner[]>(initial);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [cta, setCta] = React.useState("");
  const [clickUrl, setClickUrl] = React.useState("");
  const [placement, setPlacement] = React.useState<NonNullable<Banner["placement"]>>("hero");
  const [sectionId, setSectionId] = React.useState("");
  const [targetType, setTargetType] = React.useState<NonNullable<Banner["target_type"]>>("custom_url");
  const [targetProductId, setTargetProductId] = React.useState("");
  const [targetCategoryId, setTargetCategoryId] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    setRows(((data as unknown) as Banner[]) ?? []);
  }

  async function add() {
    setMsg(null);
    try {
      if (!imageUrl) throw new Error("Image is required");
      const supabase = createClient();
      const targetProduct = products.find((product) => product.id === targetProductId);
      const targetCategory = categories.find((category) => category.id === targetCategoryId);
      const resolvedClickUrl =
        targetType === "product" && targetProduct
          ? `/products/${targetProduct.slug}`
          : targetType === "category" && targetCategory
            ? `/category/${targetCategory.slug}`
            : targetType === "custom_url"
              ? clickUrl || null
              : null;
      const payload = {
        image_url: imageUrl,
        title: title || null,
        subtitle: subtitle || null,
        cta_text: cta || null,
        click_url: resolvedClickUrl,
        placement,
        section_id: placement === "section" || placement === "middle" ? sectionId || null : null,
        target_type: targetType,
        target_product_id: targetType === "product" ? targetProductId || null : null,
        target_category_id: targetType === "category" ? targetCategoryId || null : null,
        sort_order: rows.length + 1,
        is_active: true,
      };
      const { error } = await supabase.from("banners").insert(payload);
      if (error) throw error;
      setImageUrl(null);
      setTitle("");
      setSubtitle("");
      setCta("");
      setClickUrl("");
      setPlacement("hero");
      setSectionId("");
      setTargetType("custom_url");
      setTargetProductId("");
      setTargetCategoryId("");
      await refresh();
      setMsg("Banner added");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const supabase = createClient();
    await supabase.from("banners").update({ is_active: !isActive }).eq("id", id);
    await refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("banners").delete().eq("id", id);
    await refresh();
  }

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-5">
        <div>
          <div className="admin-section-title">Homepage Merchandising</div>
          <div className="admin-heading mt-1">Add banner</div>
          <p className="admin-subtle mt-2">Create sharp promotional slots for the storefront hero and campaign areas.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <StorageUploader label="Banner image" folder="banners" value={imageUrl} onChange={setImageUrl} />
          </div>
          <div className="space-y-2">
            <Label>Placement</Label>
            <select
              className="admin-input h-10 w-full px-3 text-sm"
              value={placement}
              onChange={(e) => setPlacement(e.target.value as NonNullable<Banner["placement"]>)}
            >
              <option value="hero">Hero carousel</option>
              <option value="section">Homepage banner section</option>
              <option value="middle">Middle banner</option>
              <option value="campaign">Offer/campaign</option>
            </select>
          </div>
          {(placement === "section" || placement === "middle") && (
            <div className="space-y-2">
              <Label>Homepage section</Label>
              <select
                className="admin-input h-10 w-full px-3 text-sm"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                <option value="">No section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input className="admin-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CTA text</Label>
            <Input className="admin-input" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Shop now" />
          </div>
          <div className="space-y-2">
            <Label>Click URL</Label>
            <Input className="admin-input" value={clickUrl} onChange={(e) => setClickUrl(e.target.value)} placeholder="/category/electronics" disabled={targetType !== "custom_url"} />
          </div>
          <div className="space-y-2">
            <Label>Click target</Label>
            <select
              className="admin-input h-10 w-full px-3 text-sm"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as NonNullable<Banner["target_type"]>)}
            >
              <option value="none">No click</option>
              <option value="custom_url">Custom URL</option>
              <option value="product">Product</option>
              <option value="category">Category</option>
            </select>
          </div>
          {targetType === "product" && (
            <div className="space-y-2">
              <Label>Target product</Label>
              <select className="admin-input h-10 w-full px-3 text-sm" value={targetProductId} onChange={(e) => setTargetProductId(e.target.value)}>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {targetType === "category" && (
            <div className="space-y-2">
              <Label>Target category</Label>
              <select className="admin-input h-10 w-full px-3 text-sm" value={targetCategoryId} onChange={(e) => setTargetCategoryId(e.target.value)}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button type="button" onClick={add}>
            Add
          </Button>
          {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
        </div>
      </div>

      <div className="admin-panel p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="admin-section-title">Campaign Stack</div>
            <div className="admin-heading mt-1">Existing banners</div>
          </div>
          <div className="admin-subtle">{rows.length} banners</div>
        </div>
        <div className="mt-4 space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="admin-list-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-medium">{b.title ?? "(no title)"}</div>
                <div className="text-xs text-muted-foreground">
                  {b.placement ?? "hero"} • {b.target_type ?? "custom_url"} • {b.click_url ?? "no link"}
                </div>
                <div className="truncate text-xs text-muted-foreground">{b.image_url}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => toggleActive(b.id, b.is_active)}>
                  {b.is_active ? "Disable" : "Enable"}
                </Button>
                <Button type="button" variant="destructive" onClick={() => remove(b.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-muted-foreground">No banners yet.</div>}
        </div>
      </div>
    </div>
  );
}

BannersAdmin.displayName = "BannersAdmin";

