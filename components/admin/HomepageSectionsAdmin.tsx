"use client";

// ============================================
// FILE: components/admin/HomepageSectionsAdmin.tsx
// PURPOSE: Build/edit/reorder rows on the homepage.
// USED IN: app/admin/homepage/page.tsx
// CHANGES IN THIS PASS:
//   * Each section row now has Edit + Up/Down reorder controls so
//     admins can change title/subtitle/order/max items/source after
//     creation (was previously only Disable/Delete).
//   * Banner sections embed HomepageSectionBannersEditor so banner
//     images can be uploaded and ordered without leaving the builder.
// ============================================

import * as React from "react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import HomepageSectionBannersEditor from "@/components/admin/HomepageSectionBannersEditor";
import type {
  Banner,
  Brand,
  Category,
  HomepageBannerLayout,
  HomepageProductSource,
  HomepageSection,
  HomepageSectionType,
  Product,
} from "@/types";

type SectionProductLink = {
  product_id: string;
  sort_order: number;
};

type AdminHomepageSection = HomepageSection & {
  homepage_section_products?: SectionProductLink[];
};

type Props = {
  initial: AdminHomepageSection[];
  initialBannersBySection: Record<string, Banner[]>;
  products: Product[];
  categories: Category[];
  brands: Brand[];
};

function flattenCategories(categories: Category[]) {
  const byId = new Map<string, Category & { children: Category[]; depth: number }>();
  categories.forEach((category) => byId.set(category.id, { ...category, children: [], depth: 0 }));
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
  const visit = (nodes: Array<Category & { children: Category[]; depth: number }>) => {
    nodes
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .forEach((node) => {
        output.push(node);
        visit(node.children as Array<Category & { children: Category[]; depth: number }>);
      });
  };
  visit(roots);
  return output;
}

export default function HomepageSectionsAdmin({
  initial,
  initialBannersBySection,
  products,
  categories,
  brands,
}: Props) {
  const [sections, setSections] = React.useState<AdminHomepageSection[]>(initial);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Add-form state.
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [sectionType, setSectionType] = React.useState<HomepageSectionType>("products");
  const [productSource, setProductSource] = React.useState<HomepageProductSource>("manual");
  const [sortOrder, setSortOrder] = React.useState("1");
  const [maxItems, setMaxItems] = React.useState("8");
  const [categoryId, setCategoryId] = React.useState("");
  const [brandId, setBrandId] = React.useState("");
  const [tickerText, setTickerText] = React.useState("");
  const [tickerSpeed, setTickerSpeed] = React.useState("28");
  const [autoBannerEnabled, setAutoBannerEnabled] = React.useState(false);
  const [autoInsertAfterCount, setAutoInsertAfterCount] = React.useState("2");
  const [selectedProducts, setSelectedProducts] = React.useState<Record<string, string>>({});

  const flatCategories = React.useMemo(() => flattenCategories(categories), [categories]);
  const productsById = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("homepage_sections")
      .select("*, homepage_section_products(product_id, sort_order)")
      .order("sort_order", { ascending: true });
    setSections(((data as unknown) as AdminHomepageSection[]) ?? []);
  }

  async function addSection() {
    setMsg(null);
    try {
      const supabase = createClient();
      const payload = {
        title,
        subtitle: subtitle.trim() || null,
        section_type: sectionType,
        product_source: sectionType === "products" ? productSource : "manual",
        category_id: productSource === "category" ? categoryId || null : null,
        brand_id: productSource === "brand" ? brandId || null : null,
        max_items: Number(maxItems) || 8,
        ticker_text: sectionType === "ticker" ? tickerText || null : null,
        ticker_speed: Number(tickerSpeed) || 28,
        banner_layout: "wide",
        auto_banner_enabled: sectionType === "banner" ? autoBannerEnabled : false,
        auto_insert_after_count: Number(autoInsertAfterCount) || 2,
        sort_order: Number(sortOrder) || sections.length + 1,
        is_active: true,
      };
      const { error } = await supabase.from("homepage_sections").insert(payload);
      if (error) throw error;
      setTitle("");
      setSubtitle("");
      setTickerText("");
      setMsg("Homepage section added");
      await refresh();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Failed to add section");
    }
  }

  async function updateSection(id: string, patch: Partial<HomepageSection>) {
    const supabase = createClient();
    await supabase.from("homepage_sections").update(patch).eq("id", id);
    await refresh();
  }

  async function removeSection(id: string) {
    if (!window.confirm("Delete this homepage section?")) return;
    const supabase = createClient();
    await supabase.from("homepage_sections").delete().eq("id", id);
    await refresh();
  }

  async function moveSection(id: string, direction: "up" | "down") {
    const ordered = [...sections].sort((a, b) => a.sort_order - b.sort_order);
    const idx = ordered.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ordered.length) return;
    const a = ordered[idx];
    const b = ordered[swapWith];
    const supabase = createClient();
    // Two updates; if either fails the local refresh below will reflect the
    // actual server state.
    await supabase
      .from("homepage_sections")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id);
    await supabase
      .from("homepage_sections")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id);
    await refresh();
  }

  async function attachProduct(section: AdminHomepageSection) {
    const productId = selectedProducts[section.id];
    if (!productId) return;
    const links = section.homepage_section_products ?? [];
    const supabase = createClient();
    await supabase.from("homepage_section_products").upsert({
      section_id: section.id,
      product_id: productId,
      sort_order: links.length + 1,
    });
    setSelectedProducts((current) => ({ ...current, [section.id]: "" }));
    await refresh();
  }

  async function detachProduct(sectionId: string, productId: string) {
    const supabase = createClient();
    await supabase
      .from("homepage_section_products")
      .delete()
      .eq("section_id", sectionId)
      .eq("product_id", productId);
    await refresh();
  }

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-5">
        <div>
          <div className="admin-section-title">Homepage Builder</div>
          <div className="admin-heading mt-1">Create homepage section</div>
          <p className="admin-subtle mt-2">
            Build product rows, offer ticker lines, and middle banner blocks in the order you want.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Section type</Label>
            <select
              className="admin-input h-10 w-full px-3 text-sm"
              value={sectionType}
              onChange={(event) => setSectionType(event.target.value as HomepageSectionType)}
            >
              <option value="products">Product section</option>
              <option value="ticker">Offer ticker</option>
              <option value="banner">Banner section</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input className="admin-input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Order</Label>
            <Input className="admin-input" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} inputMode="numeric" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Subtitle</Label>
            <Input className="admin-input" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Max products</Label>
            <Input className="admin-input" value={maxItems} onChange={(event) => setMaxItems(event.target.value)} inputMode="numeric" />
          </div>

          {sectionType === "products" && (
            <>
              <div className="space-y-2">
                <Label>Product source</Label>
                <select
                  className="admin-input h-10 w-full px-3 text-sm"
                  value={productSource}
                  onChange={(event) => setProductSource(event.target.value as HomepageProductSource)}
                >
                  <option value="manual">Manual products</option>
                  <option value="featured">Featured flag</option>
                  <option value="new_arrivals">New arrivals</option>
                  <option value="category">Category tree node</option>
                  <option value="brand">Brand</option>
                </select>
              </div>
              {productSource === "category" && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select className="admin-input h-10 w-full px-3 text-sm" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                    <option value="">Select category</option>
                    {flatCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {"— ".repeat(category.depth)}
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {productSource === "brand" && (
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <select className="admin-input h-10 w-full px-3 text-sm" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {sectionType === "ticker" && (
            <>
              <div className="space-y-2 md:col-span-2">
                <Label>Ticker text</Label>
                <Input className="admin-input" value={tickerText} onChange={(event) => setTickerText(event.target.value)} placeholder="50% OFF | Free shipping | New arrivals" />
              </div>
              <div className="space-y-2">
                <Label>Speed</Label>
                <Input className="admin-input" value={tickerSpeed} onChange={(event) => setTickerSpeed(event.target.value)} inputMode="numeric" />
              </div>
            </>
          )}

          {sectionType === "banner" && (
            <div className="flex flex-wrap items-center gap-4 md:col-span-3">
              <label className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoBannerEnabled}
                  onChange={(event) => setAutoBannerEnabled(event.target.checked)}
                />
                Auto insert banner after every
              </label>
              <Input
                className="admin-input w-24"
                value={autoInsertAfterCount}
                onChange={(event) => setAutoInsertAfterCount(event.target.value)}
                inputMode="numeric"
              />
              <span className="text-sm text-slate-500">sections</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button type="button" onClick={addSection} disabled={!title.trim()}>
            Add section
          </Button>
          {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
        </div>
      </div>

      <div className="admin-panel p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="admin-section-title">Live Order</div>
            <div className="admin-heading mt-1">Homepage sections</div>
          </div>
          <div className="admin-subtle">{sections.length} sections</div>
        </div>

        <div className="mt-4 space-y-3">
          {sections.map((section, idx) => {
            const links = (section.homepage_section_products ?? []).sort(
              (a, b) => a.sort_order - b.sort_order,
            );
            const isEditing = editingId === section.id;
            const sectionBanners = initialBannersBySection[section.id] ?? [];
            return (
              <div key={section.id} className="admin-list-row space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-950">{section.title}</div>
                      <span className="admin-status-pill">{section.section_type}</span>
                      <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                        Order {section.sort_order}
                      </span>
                      {!section.is_active && (
                        <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                          Hidden
                        </span>
                      )}
                    </div>
                    {section.subtitle && (
                      <div className="mt-1 text-sm text-slate-500">{section.subtitle}</div>
                    )}
                    {section.section_type === "banner" && section.auto_banner_enabled && (
                      <div className="mt-1 text-sm text-blue-600">
                        Auto inserts after every {section.auto_insert_after_count} sections.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Move up"
                      onClick={() => moveSection(section.id, "up")}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Move down"
                      onClick={() => moveSection(section.id, "down")}
                      disabled={idx === sections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(isEditing ? null : section.id)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      {isEditing ? "Close" : "Edit"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => updateSection(section.id, { is_active: !section.is_active })}
                    >
                      {section.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => removeSection(section.id)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {isEditing && (
                  <SectionEditForm
                    section={section}
                    flatCategories={flatCategories}
                    brands={brands}
                    onSave={async (patch) => {
                      await updateSection(section.id, patch);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                )}

                {section.section_type === "products" && section.product_source === "manual" && (
                  <div className="border-t border-slate-100 pt-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <select
                        className="admin-input h-10 w-full px-3 text-sm"
                        value={selectedProducts[section.id] ?? ""}
                        onChange={(event) =>
                          setSelectedProducts((current) => ({
                            ...current,
                            [section.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Choose product for this section</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" onClick={() => attachProduct(section)}>
                        Attach product
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {links.map((link) => {
                        const product = productsById.get(link.product_id);
                        if (!product) return null;
                        return (
                          <span
                            key={link.product_id}
                            className="inline-flex items-center gap-2 border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800"
                          >
                            {link.sort_order}. {product.name}
                            <button
                              type="button"
                              className="font-semibold text-blue-950"
                              onClick={() => detachProduct(section.id, product.id)}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                      {links.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          No manual products selected yet.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {section.section_type === "banner" && (
                  <div className="border-t border-slate-100 pt-4">
                    <HomepageSectionBannersEditor
                      sectionId={section.id}
                      initial={sectionBanners}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {sections.length === 0 && (
            <div className="text-sm text-muted-foreground">No homepage sections yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

HomepageSectionsAdmin.displayName = "HomepageSectionsAdmin";

// ============================================================
// Inline edit form for a single section. Mirrors the create form
// fields so admins can update anything they originally entered.
// ============================================================

function SectionEditForm({
  section,
  flatCategories,
  brands,
  onSave,
  onCancel,
}: {
  section: HomepageSection;
  flatCategories: Array<Category & { depth: number }>;
  brands: Brand[];
  onSave: (patch: Partial<HomepageSection>) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState(section.title);
  const [subtitle, setSubtitle] = React.useState(section.subtitle ?? "");
  const [sortOrder, setSortOrder] = React.useState(String(section.sort_order));
  const [maxItems, setMaxItems] = React.useState(String(section.max_items));
  const [productSource, setProductSource] = React.useState<HomepageProductSource>(
    section.product_source,
  );
  const [categoryId, setCategoryId] = React.useState(section.category_id ?? "");
  const [brandId, setBrandId] = React.useState(section.brand_id ?? "");
  const [tickerText, setTickerText] = React.useState(section.ticker_text ?? "");
  const [tickerSpeed, setTickerSpeed] = React.useState(String(section.ticker_speed));
  const [bannerLayout, setBannerLayout] = React.useState<HomepageBannerLayout>(
    section.banner_layout,
  );
  const [autoBannerEnabled, setAutoBannerEnabled] = React.useState(
    section.auto_banner_enabled,
  );
  const [autoInsertAfterCount, setAutoInsertAfterCount] = React.useState(
    String(section.auto_insert_after_count),
  );
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const patch: Partial<HomepageSection> = {
        title: title.trim() || section.title,
        subtitle: subtitle.trim() || null,
        sort_order: Number(sortOrder) || section.sort_order,
        max_items: Number(maxItems) || section.max_items,
      };
      if (section.section_type === "products") {
        patch.product_source = productSource;
        patch.category_id = productSource === "category" ? categoryId || null : null;
        patch.brand_id = productSource === "brand" ? brandId || null : null;
      }
      if (section.section_type === "ticker") {
        patch.ticker_text = tickerText.trim() || null;
        patch.ticker_speed = Number(tickerSpeed) || section.ticker_speed;
      }
      if (section.section_type === "banner") {
        patch.banner_layout = bannerLayout;
        patch.auto_banner_enabled = autoBannerEnabled;
        patch.auto_insert_after_count =
          Number(autoInsertAfterCount) || section.auto_insert_after_count;
      }
      await onSave(patch);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-blue-100 bg-blue-50/30 p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label>Title</Label>
          <Input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Order</Label>
          <Input
            className="admin-input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Subtitle</Label>
          <Input className="admin-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Max items</Label>
          <Input
            className="admin-input"
            value={maxItems}
            onChange={(e) => setMaxItems(e.target.value)}
            inputMode="numeric"
          />
        </div>

        {section.section_type === "products" && (
          <>
            <div className="space-y-2">
              <Label>Product source</Label>
              <select
                className="admin-input h-10 w-full px-3 text-sm"
                value={productSource}
                onChange={(e) => setProductSource(e.target.value as HomepageProductSource)}
              >
                <option value="manual">Manual products</option>
                <option value="featured">Featured flag</option>
                <option value="new_arrivals">New arrivals</option>
                <option value="category">Category tree node</option>
                <option value="brand">Brand</option>
              </select>
            </div>
            {productSource === "category" && (
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="admin-input h-10 w-full px-3 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select category</option>
                  {flatCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {"— ".repeat(c.depth)}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {productSource === "brand" && (
              <div className="space-y-2">
                <Label>Brand</Label>
                <select
                  className="admin-input h-10 w-full px-3 text-sm"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {section.section_type === "ticker" && (
          <>
            <div className="space-y-2 md:col-span-2">
              <Label>Ticker text</Label>
              <Input
                className="admin-input"
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Speed</Label>
              <Input
                className="admin-input"
                value={tickerSpeed}
                onChange={(e) => setTickerSpeed(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </>
        )}

        {section.section_type === "banner" && (
          <>
            <div className="space-y-2">
              <Label>Banner layout</Label>
              <select
                className="admin-input h-10 w-full px-3 text-sm"
                value={bannerLayout}
                onChange={(e) => setBannerLayout(e.target.value as HomepageBannerLayout)}
              >
                <option value="wide">Wide (single)</option>
                <option value="grid">2-up grid</option>
                <option value="split">Split</option>
              </select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <label className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoBannerEnabled}
                  onChange={(e) => setAutoBannerEnabled(e.target.checked)}
                />
                Auto-insert after every
              </label>
              <Input
                className="admin-input w-24"
                value={autoInsertAfterCount}
                onChange={(e) => setAutoInsertAfterCount(e.target.value)}
                inputMode="numeric"
              />
              <span className="text-sm text-slate-500">sections</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
