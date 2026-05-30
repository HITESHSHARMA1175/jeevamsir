"use client";

// ============================================
// FILE: components/admin/ProductsAdmin.tsx
// PURPOSE: Client CRUD UI for products. Admin can:
//   * Upload up to 6 images (cover = first)
//   * Add flexible attribute groups (size/color/type)
//   * Edit any existing product via the Manage panel
// USED IN: app/admin/products/page.tsx
// ============================================

import * as React from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MultiImageUploader from "@/components/admin/MultiImageUploader";
import ProductAttributesEditor from "@/components/admin/ProductAttributesEditor";
import ProductEditPanel from "@/components/admin/ProductEditPanel";
import type { Brand, Category, Product, ProductAttributeGroup } from "@/types";

type Props = {
  categories: Category[];
  brands: Brand[];
  initial: Product[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ProductsAdmin({
  categories,
  brands: initialBrands,
  initial,
}: Props) {
  const [rows, setRows] = React.useState<Product[]>(initial);
  const [brands, setBrands] = React.useState<Brand[]>(initialBrands);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // New product form
  const [name, setName] = React.useState("");
  const [brandId, setBrandId] = React.useState<string>("");
  const [brandQuery, setBrandQuery] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string | null>(
    categories[0]?.id ?? null,
  );
  const [images, setImages] = React.useState<string[]>([]);
  const [mrp, setMrp] = React.useState<string>("1999");
  const [sell, setSell] = React.useState<string>("1299");
  const [desc, setDesc] = React.useState<string>("");
  const [featured, setFeatured] = React.useState(false);
  const [inStock, setInStock] = React.useState(true);
  const [attributes, setAttributes] = React.useState<ProductAttributeGroup[]>(
    [],
  );

  function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    if (e && typeof e === "object" && "message" in e) {
      const m = (e as { message?: unknown }).message;
      if (typeof m === "string") return m;
    }
    try {
      return JSON.stringify(e);
    } catch {
      return "Failed";
    }
  }

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, brand:brands(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows(((data as unknown) as Product[]) ?? []);
  }

  async function refreshBrands() {
    const supabase = createClient();
    const { data } = await supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    setBrands(((data as unknown) as Brand[]) ?? []);
  }

  async function createBrand(value: string): Promise<Brand> {
    const cleanName = value.trim();
    if (!cleanName) throw new Error("Brand name is required");
    const supabase = createClient();
    const payload = {
      name: cleanName,
      slug: slugify(cleanName),
      is_active: true,
      sort_order: brands.length + 1,
    };
    const { data, error } = await supabase
      .from("brands")
      .upsert(payload, { onConflict: "slug" })
      .select("*")
      .single();
    if (error) throw error;
    const nextBrand = data as unknown as Brand;
    await refreshBrands();
    setBrandId(nextBrand.id);
    setBrandQuery(nextBrand.name);
    return nextBrand;
  }

  async function add() {
    setMsg(null);
    try {
      const supabase = createClient();
      if (images.length === 0) throw new Error("At least one image is required");
      const selectedBrand =
        brands.find((brand) => brand.id === brandId) ??
        (brandQuery.trim() ? await createBrand(brandQuery) : null);
      const payload = {
        name,
        brand_id: selectedBrand?.id ?? null,
        brand_name: selectedBrand?.name ?? null,
        slug: slugify(name),
        category_id: categoryId,
        subcategory_id: null,
        description: desc || null,
        image_url: images[0],
        image_gallery: images.slice(1),
        mrp_price: Number(mrp),
        sell_price: Number(sell),
        in_stock: inStock,
        is_featured: featured,
        tags: [],
        sort_order: 0,
        attributes,
      };
      if (payload.sell_price > payload.mrp_price)
        throw new Error("sell_price must be <= mrp_price");
      const { error } = await supabase.from("products").insert(payload);
      if (error) throw error;
      setName("");
      setBrandId("");
      setBrandQuery("");
      setDesc("");
      setImages([]);
      setAttributes([]);
      setMsg("Product added");
      await refresh();
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    await refresh();
  }

  async function toggleFeatured(id: string, isFeatured: boolean) {
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ is_featured: !isFeatured })
      .eq("id", id);
    await refresh();
  }

  async function toggleStock(id: string, in_stock: boolean) {
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ in_stock: !in_stock })
      .eq("id", id);
    await refresh();
  }

  const flatCategories = React.useMemo(() => {
    const byId = new Map<
      string,
      Category & { children: Category[]; depth: number }
    >();
    categories.forEach((category) => {
      byId.set(category.id, { ...category, children: [], depth: 0 });
    });
    const roots: Array<Category & { children: Category[]; depth: number }> = [];
    byId.forEach((node) => {
      const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const output: Array<Category & { depth: number }> = [];
    const visit = (
      nodes: Array<Category & { children: Category[]; depth: number }>,
    ) => {
      nodes
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order || a.name.localeCompare(b.name),
        )
        .forEach((node) => {
          output.push(node);
          visit(
            node.children as Array<
              Category & { children: Category[]; depth: number }
            >,
          );
        });
    };
    visit(roots);
    return output;
  }, [categories]);

  const filteredBrands = React.useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((brand) => brand.name.toLowerCase().includes(q));
  }, [brandQuery, brands]);

  const canCreateBrand =
    brandQuery.trim().length > 0 &&
    !brands.some(
      (brand) => brand.name.toLowerCase() === brandQuery.trim().toLowerCase(),
    );

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-5">
        <div>
          <div className="admin-section-title">Catalog Builder</div>
          <div className="admin-heading mt-1">Add product</div>
          <p className="admin-subtle mt-2">
            Create a storefront-ready item. Upload up to 6 images (the first is
            the cover thumbnail) and add any size/color/type options customers
            should pick.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              className="admin-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Banarasi Silk Saree - Red"
            />
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input
              className="admin-input"
              value={brandQuery}
              onChange={(e) => {
                setBrandQuery(e.target.value);
                setBrandId("");
              }}
              placeholder="Search or create brand"
            />
            <select
              className="admin-input h-10 w-full px-3 text-sm"
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                setBrandQuery(
                  brands.find((brand) => brand.id === e.target.value)?.name ??
                    "",
                );
              }}
            >
              <option value="">No brand selected</option>
              {filteredBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            {canCreateBrand && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void createBrand(brandQuery)}
              >
                + Create {brandQuery.trim()}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="admin-input h-10 w-full px-3 text-sm"
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
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

          <div className="md:col-span-2">
            <MultiImageUploader value={images} onChange={setImages} max={6} />
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

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              className="admin-input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
            />
          </div>

          <div className="md:col-span-2">
            <ProductAttributesEditor
              value={attributes}
              onChange={setAttributes}
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

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button type="button" onClick={add} disabled={!name.trim()}>
            Add product
          </Button>
          {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
        </div>
      </div>

      <div className="admin-panel p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="admin-section-title">Inventory Surface</div>
            <div className="admin-heading mt-1">Recent products</div>
          </div>
          <div className="admin-subtle">{rows.length} products</div>
        </div>
        <div className="mt-4 space-y-3">
          {rows.map((p) => (
            <div key={p.id} className="space-y-3">
              <div className="admin-list-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm border bg-slate-50">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.brand?.name ?? p.brand_name ?? "No brand"} • /{p.slug}
                      {Array.isArray(p.image_gallery) &&
                        p.image_gallery.length > 0 && (
                          <span className="ml-2 inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            {p.image_gallery.length + 1} imgs
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditingId((current) => (current === p.id ? null : p.id))
                    }
                  >
                    {editingId === p.id ? "Close" : "Manage"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStock(p.id, p.in_stock)}
                  >
                    {p.in_stock ? "Out of stock" : "In stock"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFeatured(p.id, p.is_featured)}
                  >
                    {p.is_featured ? "Unfeature" : "Feature"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(p.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {editingId === p.id && (
                <ProductEditPanel
                  product={p}
                  categories={categories}
                  brands={brands}
                  onClose={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    void refresh();
                  }}
                />
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No products yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ProductsAdmin.displayName = "ProductsAdmin";
