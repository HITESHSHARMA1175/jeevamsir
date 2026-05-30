"use client";

// ============================================
// FILE: components/admin/ProductEditPanel.tsx
// PURPOSE: Full edit form for an existing product. Lets the
//          admin manage images (up to 6), pricing, stock, SEO,
//          and flexible attribute groups (size/color/type/etc.).
// USED IN: components/admin/ProductsAdmin.tsx (Manage button)
// ============================================

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MultiImageUploader from "@/components/admin/MultiImageUploader";
import ProductAttributesEditor from "@/components/admin/ProductAttributesEditor";
import type {
  Brand,
  Category,
  Product,
  ProductAttributeGroup,
} from "@/types";

type Props = {
  product: Product;
  categories: Category[];
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
};

function imageList(product: Product): string[] {
  const list: string[] = [];
  if (product.image_url) list.push(product.image_url);
  (product.image_gallery ?? []).forEach((url) => {
    if (url && !list.includes(url)) list.push(url);
  });
  return list.slice(0, 6);
}

export default function ProductEditPanel({
  product,
  categories,
  brands,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = React.useState(product.name ?? "");
  const [slug, setSlug] = React.useState(product.slug ?? "");
  const [description, setDescription] = React.useState(product.description ?? "");
  const [mrp, setMrp] = React.useState(String(product.mrp_price ?? ""));
  const [sell, setSell] = React.useState(String(product.sell_price ?? ""));
  const [categoryId, setCategoryId] = React.useState(product.category_id ?? "");
  const [brandId, setBrandId] = React.useState(product.brand_id ?? "");
  const [inStock, setInStock] = React.useState(product.in_stock);
  const [featured, setFeatured] = React.useState(product.is_featured);
  const [metaTitle, setMetaTitle] = React.useState(product.meta_title ?? "");
  const [metaDesc, setMetaDesc] = React.useState(product.meta_desc ?? "");
  const [tags, setTags] = React.useState((product.tags ?? []).join(", "));
  const [images, setImages] = React.useState<string[]>(imageList(product));
  const [attributes, setAttributes] = React.useState<ProductAttributeGroup[]>(
    Array.isArray(product.attributes) ? product.attributes : [],
  );
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const flatCategories = React.useMemo(() => {
    type Node = Category & { children: Node[]; depth: number };
    const byId = new Map<string, Node>();
    categories.forEach((category) => {
      byId.set(category.id, { ...category, children: [], depth: 0 });
    });
    const roots: Node[] = [];
    byId.forEach((node) => {
      const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });
    const out: Array<Category & { depth: number }> = [];
    const visit = (nodes: Node[]) => {
      nodes
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
        .forEach((node) => {
          out.push(node);
          visit(node.children);
        });
    };
    visit(roots);
    return out;
  }, [categories]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const supabase = createClient();
      if (!images[0]) throw new Error("At least one image is required");
      const mrpNum = Number(mrp);
      const sellNum = Number(sell);
      if (Number.isNaN(mrpNum) || Number.isNaN(sellNum)) {
        throw new Error("MRP and Sell price must be numbers");
      }
      if (sellNum > mrpNum) throw new Error("sell_price must be <= mrp_price");

      const selectedBrand = brands.find((brand) => brand.id === brandId) ?? null;
      const payload = {
        name,
        slug,
        description: description || null,
        image_url: images[0],
        image_gallery: images.slice(1),
        mrp_price: mrpNum,
        sell_price: sellNum,
        category_id: categoryId || null,
        brand_id: brandId || null,
        brand_name: selectedBrand?.name ?? null,
        in_stock: inStock,
        is_featured: featured,
        meta_title: metaTitle || null,
        meta_desc: metaDesc || null,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        attributes,
      };

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id);
      if (error) throw error;
      setMsg("Saved!");
      onSaved();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel mt-3 space-y-5 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="admin-section-title">Edit product</div>
          <div className="admin-heading mt-1 truncate">{product.name}</div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <MultiImageUploader value={images} onChange={setImages} max={6} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            className="admin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            className="admin-input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>MRP</Label>
          <Input
            className="admin-input"
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="space-y-2">
          <Label>Sell price</Label>
          <Input
            className="admin-input"
            value={sell}
            onChange={(e) => setSell(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <select
            className="admin-input h-10 w-full px-3 text-sm"
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">(none)</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {"— ".repeat(c.depth)}
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Brand</Label>
          <select
            className="admin-input h-10 w-full px-3 text-sm"
            value={brandId ?? ""}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">(none)</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Textarea
            className="admin-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Tags (comma separated)</Label>
          <Input
            className="admin-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="silk, banarasi, red"
          />
        </div>
        <div className="space-y-2">
          <Label>Meta title</Label>
          <Input
            className="admin-input"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Meta description</Label>
          <Input
            className="admin-input"
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 md:col-span-2">
          <label className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            In stock
          </label>
          <label className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured
          </label>
        </div>
      </div>

      <ProductAttributesEditor value={attributes} onChange={setAttributes} />

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
      </div>
    </div>
  );
}

ProductEditPanel.displayName = "ProductEditPanel";
