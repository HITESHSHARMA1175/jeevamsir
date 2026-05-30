"use client";

// ============================================
// FILE: components/admin/SEOAdmin.tsx
// PURPOSE: Tabs-based SEO admin.
//   1. Global  : default meta, OG, schema.org, robots, business identity
//   2. Tracking: GTM, GA, GSC, Bing
//   3. Per-page: list of seo_pages overrides
//   4. Keywords: free-form keyword research notes
// USED IN: app/admin/seo/page.tsx
// ============================================

import * as React from "react";
import { ChevronDown, ChevronRight, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SeoKeyword, SeoPage, SiteSettings } from "@/types";

// Best-effort cache bust for ISR pages so the new SEO is visible
// immediately on the public storefront. Failure is non-fatal.
async function revalidateStorePath(path: string | null) {
  try {
    await fetch("/api/admin/seo/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path }),
    });
  } catch (e) {
    console.warn(`Cache revalidation failed for ${path}:`, e);
    // Failure is non-fatal, but log for debugging
  }
}

function hasPageOverride(page: SeoPage): boolean {
  return Boolean(
    page.title?.trim() ||
      page.description?.trim() ||
      page.og_title?.trim() ||
      page.og_desc?.trim() ||
      page.og_image?.trim() ||
      page.canonical_url?.trim() ||
      (page.keywords && page.keywords.length > 0) ||
      page.robots_index !== null ||
      page.json_ld,
  );
}

type Props = {
  settings: SiteSettings | null;
  pages: SeoPage[];
  keywords: SeoKeyword[];
};

type Tab = "global" | "tracking" | "pages" | "keywords";

const tabs: { id: Tab; label: string }[] = [
  { id: "global", label: "Global" },
  { id: "tracking", label: "Tracking & Verification" },
  { id: "pages", label: "Per-page SEO" },
  { id: "keywords", label: "Keywords" },
];

export default function SEOAdmin({
  settings,
  pages: initialPages,
  keywords: initialKeywords,
}: Props) {
  const [tab, setTab] = React.useState<Tab>("global");
  const [pages, setPages] = React.useState<SeoPage[]>(initialPages);
  const [keywords, setKeywords] = React.useState<SeoKeyword[]>(initialKeywords);

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-2">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "global" && <GlobalTab initial={settings} />}
      {tab === "tracking" && <TrackingTab initial={settings} />}
      {tab === "pages" && (
        <PagesTab initial={pages} onChange={setPages} />
      )}
      {tab === "keywords" && (
        <KeywordsTab initial={keywords} onChange={setKeywords} />
      )}
    </div>
  );
}

function GlobalTab({ initial }: { initial: SiteSettings | null }) {
  const [metaTitle, setMetaTitle] = React.useState(initial?.meta_title ?? "");
  const [metaDesc, setMetaDesc] = React.useState(initial?.meta_desc ?? "");
  const [keywords, setKeywords] = React.useState<string[]>(
    initial?.meta_keywords ?? [],
  );
  const [ogImage, setOgImage] = React.useState(initial?.og_image ?? "");
  const [defaultOgTitle, setDefaultOgTitle] = React.useState(
    initial?.default_og_title ?? "",
  );
  const [defaultOgDesc, setDefaultOgDesc] = React.useState(
    initial?.default_og_desc ?? "",
  );
  const [robotsIndex, setRobotsIndex] = React.useState(
    initial?.robots_index_default ?? true,
  );
  const [schemaType, setSchemaType] = React.useState(
    initial?.schema_org_type ?? "Organization",
  );
  const [businessName, setBusinessName] = React.useState(
    initial?.business_name ?? "",
  );
  const [businessAddress, setBusinessAddress] = React.useState(
    initial?.business_address ?? "",
  );
  const [businessPhone, setBusinessPhone] = React.useState(
    initial?.business_phone ?? "",
  );
  const [businessEmail, setBusinessEmail] = React.useState(
    initial?.business_email ?? "",
  );
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  if (!initial) {
    return (
      <div className="admin-panel p-5 text-sm text-muted-foreground">
        Site settings row missing. Save site identity first in Site.
      </div>
    );
  }

  function addKeyword() {
    const next = draft.trim();
    if (!next) return;
    if (keywords.includes(next)) return;
    setKeywords([...keywords, next]);
    setDraft("");
  }

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("site_settings")
        .update({
          meta_title: metaTitle || initial!.meta_title,
          meta_desc: metaDesc || initial!.meta_desc,
          meta_keywords: keywords,
          og_image: ogImage || null,
          default_og_title: defaultOgTitle || null,
          default_og_desc: defaultOgDesc || null,
          robots_index_default: robotsIndex,
          schema_org_type: schemaType || "Organization",
          business_name: businessName || null,
          business_address: businessAddress || null,
          business_phone: businessPhone || null,
          business_email: businessEmail || null,
        })
        .eq("id", initial!.id);
      if (error) throw error;
      await revalidateStorePath(null);
      toast.success("Global SEO saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel space-y-4 p-5">
      <div>
        <div className="admin-section-title">Global SEO</div>
        <div className="admin-heading mt-1">Defaults for every page</div>
        <p className="admin-subtle mt-2">
          Per-page overrides (set in the Per-page SEO tab) win over these
          defaults.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Default meta title</Label>
          <Input
            className="admin-input"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Default meta description</Label>
          <Input
            className="admin-input"
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Default OG image URL</Label>
          <Input
            className="admin-input"
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Default OG title</Label>
          <Input
            className="admin-input"
            value={defaultOgTitle}
            onChange={(e) => setDefaultOgTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Default OG description</Label>
          <Textarea
            className="admin-input"
            rows={2}
            value={defaultOgDesc}
            onChange={(e) => setDefaultOgDesc(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Default keywords</Label>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw, i) => (
              <span
                key={`${kw}-${i}`}
                className="inline-flex items-center gap-1 rounded-sm border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              >
                {kw}
                <button
                  type="button"
                  onClick={() =>
                    setKeywords(keywords.filter((_, idx) => idx !== i))
                  }
                  aria-label={`Remove ${kw}`}
                  className="rounded-full p-0.5 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {keywords.length === 0 && (
              <span className="text-xs text-slate-500">No keywords yet.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              className="admin-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="e.g. silk saree, banarasi saree, indian wear"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKeyword}
            >
              Add
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Schema.org business type</Label>
          <Input
            className="admin-input"
            value={schemaType}
            onChange={(e) => setSchemaType(e.target.value)}
            placeholder="Organization, OnlineStore, ClothingStore, ..."
          />
        </div>
        <div className="space-y-2">
          <Label>Business name</Label>
          <Input
            className="admin-input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Business email</Label>
          <Input
            className="admin-input"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Business phone</Label>
          <Input
            className="admin-input"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Business address</Label>
          <Textarea
            className="admin-input"
            rows={2}
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={robotsIndex}
            onChange={(e) => setRobotsIndex(e.target.checked)}
          />
          Allow search engines to index the site (uncheck to add Disallow: / to robots.txt — useful for pre-launch)
        </label>
      </div>

      <Button type="button" onClick={save} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save global SEO"}
      </Button>
    </div>
  );
}

function TrackingTab({ initial }: { initial: SiteSettings | null }) {
  const [gaId, setGaId] = React.useState(initial?.ga_id ?? "");
  const [gtmId, setGtmId] = React.useState(initial?.gtm_id ?? "");
  const [gsc, setGsc] = React.useState(initial?.gsc_verification ?? "");
  const [bing, setBing] = React.useState(initial?.bing_verification ?? "");
  const [saving, setSaving] = React.useState(false);

  if (!initial) {
    return (
      <div className="admin-panel p-5 text-sm text-muted-foreground">
        Site settings row missing.
      </div>
    );
  }

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("site_settings")
        .update({
          ga_id: gaId || null,
          gtm_id: gtmId || null,
          gsc_verification: gsc || null,
          bing_verification: bing || null,
        })
        .eq("id", initial!.id);
      if (error) throw error;
      await revalidateStorePath(null);
      toast.success("Tracking settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel space-y-4 p-5">
      <div>
        <div className="admin-section-title">Tracking & Verification</div>
        <div className="admin-heading mt-1">Analytics + ownership tags</div>
        <p className="admin-subtle mt-2">
          These are injected into the document head on every page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Google Analytics measurement ID</Label>
          <Input
            className="admin-input"
            value={gaId}
            onChange={(e) => setGaId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
          />
        </div>
        <div className="space-y-2">
          <Label>Google Tag Manager container ID</Label>
          <Input
            className="admin-input"
            value={gtmId}
            onChange={(e) => setGtmId(e.target.value)}
            placeholder="GTM-XXXXXX"
          />
        </div>
        <div className="space-y-2">
          <Label>Google Search Console verification</Label>
          <Input
            className="admin-input"
            value={gsc}
            onChange={(e) => setGsc(e.target.value)}
            placeholder="(content of meta tag)"
          />
        </div>
        <div className="space-y-2">
          <Label>Bing verification</Label>
          <Input
            className="admin-input"
            value={bing}
            onChange={(e) => setBing(e.target.value)}
          />
        </div>
      </div>

      <Button type="button" onClick={save} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save tracking settings"}
      </Button>
    </div>
  );
}

function PagesTab({
  initial,
  onChange,
}: {
  initial: SeoPage[];
  onChange: (next: SeoPage[]) => void;
}) {
  const [rows, setRows] = React.useState<SeoPage[]>(initial);
  const [draftPath, setDraftPath] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("seo_pages")
      .select("*")
      .order("path", { ascending: true });
    if (data && Array.isArray(data)) {
      setRows(data as SeoPage[]);
      onChange(data as SeoPage[]);
    } else {
      setRows([]);
    }
  }

  async function addPath() {
    const path = draftPath.trim();
    if (!path) return;
    if (!path.startsWith("/")) {
      toast.error("Path must start with /");
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("seo_pages")
      .upsert({ path, keywords: [] }, { onConflict: "path" })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraftPath("");
    await refresh();
    // Auto-expand the row we just added so the admin lands directly
    // on the edit form for it.
    if (data && typeof data === "object" && "id" in data) {
      setEditingId((data as unknown as SeoPage).id);
    }
  }

  async function removeRow(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("seo_pages").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (editingId === id) setEditingId(null);
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel p-5">
        <div className="admin-section-title">Per-page overrides</div>
        <div className="admin-heading mt-1">Add a path to override</div>
        <p className="admin-subtle mt-2">
          Set the URL path you want to customise (e.g. <code>/</code>,{" "}
          <code>/checkout</code>, <code>/category/sarees</code>). Click any row
          below to edit just that page's SEO.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            className="admin-input"
            placeholder="/category/sarees"
            value={draftPath}
            onChange={(e) => setDraftPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addPath();
              }
            }}
          />
          <Button type="button" onClick={() => void addPath()}>
            <Plus className="mr-2 h-4 w-4" /> Add path
          </Button>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="admin-panel p-5 text-sm text-muted-foreground">
          No per-page overrides yet.
        </div>
      )}

      <div className="space-y-2">
        {rows.map((page) => {
          const isOpen = editingId === page.id;
          const hasData = hasPageOverride(page);
          return (
            <div
              key={page.id}
              className="admin-panel overflow-hidden p-0"
            >
              <button
                type="button"
                onClick={() => setEditingId(isOpen ? null : page.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-50/40"
                aria-expanded={isOpen}
              >
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-sm bg-blue-50 text-blue-700">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm font-semibold text-slate-950">
                    {page.path}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {page.title?.trim() || (
                      <span className="italic">No title set yet</span>
                    )}
                  </span>
                </span>
                {hasData ? (
                  <span className="hidden flex-shrink-0 rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 sm:inline-block">
                    Saved
                  </span>
                ) : (
                  <span className="hidden flex-shrink-0 rounded-sm border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:inline-block">
                    Empty
                  </span>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                  {isOpen ? "Close" : "Edit"}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 bg-slate-50/40 p-4">
                  <PageOverrideEditor
                    value={page}
                    onSaved={() => void refresh()}
                    onDelete={() => void removeRow(page.id)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PageOverrideEditor({
  value,
  onSaved,
  onDelete,
}: {
  value: SeoPage;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = React.useState(value.title ?? "");
  const [desc, setDesc] = React.useState(value.description ?? "");
  const [keywords, setKeywords] = React.useState<string[]>(value.keywords ?? []);
  const [ogTitle, setOgTitle] = React.useState(value.og_title ?? "");
  const [ogDesc, setOgDesc] = React.useState(value.og_desc ?? "");
  const [ogImage, setOgImage] = React.useState(value.og_image ?? "");
  const [canonical, setCanonical] = React.useState(value.canonical_url ?? "");
  const [robotsIndex, setRobotsIndex] = React.useState<boolean | null>(
    value.robots_index ?? null,
  );
  const [jsonLd, setJsonLd] = React.useState(
    value.json_ld ? JSON.stringify(value.json_ld, null, 2) : "",
  );
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function addKeyword() {
    const next = draft.trim();
    if (!next) return;
    if (keywords.includes(next)) return;
    setKeywords([...keywords, next]);
    setDraft("");
  }

  async function save() {
    setSaving(true);
    try {
      let jsonLdValue: Record<string, unknown> | null = null;
      if (jsonLd.trim()) {
        try {
          jsonLdValue = JSON.parse(jsonLd) as Record<string, unknown>;
        } catch (parseErr) {
          const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
          throw new Error(`JSON-LD must be valid JSON: ${msg}`);
        }
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("seo_pages")
        .update({
          title: title || null,
          description: desc || null,
          keywords,
          og_title: ogTitle || null,
          og_desc: ogDesc || null,
          og_image: ogImage || null,
          canonical_url: canonical || null,
          robots_index: robotsIndex,
          json_ld: jsonLdValue,
        })
        .eq("id", value.id);
      if (error) throw error;
      await revalidateStorePath(value.path);
      toast.success(`Saved ${value.path}`);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="admin-section-title">Editing</div>
          <div className="admin-heading mt-1 break-all font-mono text-sm sm:text-base">
            {value.path}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={onDelete}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Delete override
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Title</Label>
          <Input
            className="admin-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Input
            className="admin-input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>OG title</Label>
          <Input
            className="admin-input"
            value={ogTitle}
            onChange={(e) => setOgTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>OG description</Label>
          <Input
            className="admin-input"
            value={ogDesc}
            onChange={(e) => setOgDesc(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>OG image URL</Label>
          <Input
            className="admin-input"
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Canonical URL</Label>
          <Input
            className="admin-input"
            value={canonical}
            onChange={(e) => setCanonical(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Keywords</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {keywords.map((kw, i) => (
              <span
                key={`${kw}-${i}`}
                className="inline-flex items-center gap-1 rounded-sm border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              >
                {kw}
                <button
                  type="button"
                  onClick={() =>
                    setKeywords(keywords.filter((_, idx) => idx !== i))
                  }
                  aria-label={`Remove ${kw}`}
                  className="rounded-full p-0.5 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              className="admin-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addKeyword}
            >
              Add
            </Button>
          </div>
        </div>
        <div className="md:col-span-2">
          <Label>Robots</Label>
          <div className="mt-1 flex gap-2">
            {[
              { id: "default", label: "Inherit global default" },
              { id: "true", label: "Index this page" },
              { id: "false", label: "noindex" },
            ].map((opt) => {
              const active =
                (opt.id === "default" && robotsIndex === null) ||
                (opt.id === "true" && robotsIndex === true) ||
                (opt.id === "false" && robotsIndex === false);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setRobotsIndex(
                      opt.id === "default"
                        ? null
                        : opt.id === "true",
                    )
                  }
                  className={`rounded-sm border px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "border-blue-200 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-2">
          <Label>JSON-LD (optional)</Label>
          <Textarea
            className="admin-input font-mono text-xs"
            rows={6}
            value={jsonLd}
            onChange={(e) => setJsonLd(e.target.value)}
            placeholder='{"@context":"https://schema.org",...}'
          />
        </div>
      </div>

      <Button type="button" onClick={() => void save()} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : `Save ${value.path}`}
      </Button>
    </div>
  );
}

function KeywordsTab({
  initial,
  onChange,
}: {
  initial: SeoKeyword[];
  onChange: (next: SeoKeyword[]) => void;
}) {
  const [rows, setRows] = React.useState<SeoKeyword[]>(initial);
  const [keyword, setKeyword] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [vol, setVol] = React.useState("");
  const [diff, setDiff] = React.useState("");
  const [notes, setNotes] = React.useState("");

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("seo_keywords")
      .select("*")
      .order("keyword", { ascending: true });
    if (data && Array.isArray(data)) {
      setRows(data as SeoKeyword[]);
      onChange(data as SeoKeyword[]);
    } else {
      setRows([]);
    }
  }

  async function addRow() {
    if (!keyword.trim()) return;
    const supabase = createClient();
    const payload = {
      keyword: keyword.trim(),
      target_path: target.trim() || null,
      search_volume: vol ? Number(vol) : null,
      difficulty: diff ? Number(diff) : null,
      notes: notes.trim() || null,
    };
    const { error } = await supabase.from("seo_keywords").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    setKeyword("");
    setTarget("");
    setVol("");
    setDiff("");
    setNotes("");
    await refresh();
  }

  async function removeRow(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("seo_keywords").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel p-5">
        <div className="admin-section-title">Keywords</div>
        <div className="admin-heading mt-1">Research notes</div>
        <p className="admin-subtle mt-2">
          The SEO team can track target keywords here. Optionally map a keyword
          to a path that should rank for it.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Keyword</Label>
            <Input
              className="admin-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Target path</Label>
            <Input
              className="admin-input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="/category/sarees"
            />
          </div>
          <div className="space-y-1">
            <Label>Volume</Label>
            <Input
              className="admin-input"
              value={vol}
              onChange={(e) => setVol(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <Label>Difficulty (0–100)</Label>
            <Input
              className="admin-input"
              value={diff}
              onChange={(e) => setDiff(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              className="admin-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3">
          <Button type="button" onClick={() => void addRow()}>
            <Plus className="mr-2 h-4 w-4" /> Add keyword
          </Button>
        </div>
      </div>

      <div className="admin-panel p-5">
        <div className="admin-section-title">List</div>
        <div className="mt-3 overflow-hidden rounded-sm border border-slate-200 bg-white">
          <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <div className="col-span-4">Keyword</div>
            <div className="col-span-3">Target</div>
            <div className="col-span-1 text-right">Vol</div>
            <div className="col-span-1 text-right">KD</div>
            <div className="col-span-3 text-right">Notes</div>
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-12 items-start gap-2 border-t border-slate-100 px-4 py-3 text-sm"
            >
              <div className="col-span-4 font-medium">{row.keyword}</div>
              <div className="col-span-3 text-muted-foreground">
                {row.target_path ?? "—"}
              </div>
              <div className="col-span-1 text-right">{row.search_volume ?? "—"}</div>
              <div className="col-span-1 text-right">{row.difficulty ?? "—"}</div>
              <div className="col-span-3 flex items-start justify-end gap-2 text-right text-muted-foreground">
                <span className="line-clamp-2 text-left">{row.notes ?? "—"}</span>
                <button
                  type="button"
                  onClick={() => void removeRow(row.id)}
                  aria-label="Delete keyword"
                  className="rounded-sm p-1 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="border-t border-slate-100 px-4 py-8 text-center text-sm text-muted-foreground">
              No keywords yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

SEOAdmin.displayName = "SEOAdmin";
