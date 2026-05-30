"use client";

// ============================================
// FILE: components/admin/HomepageSectionBannersEditor.tsx
// PURPOSE: Inline banner manager that lives INSIDE a homepage
//          banner-section card. Uploads images, edits text/CTA,
//          reorders banners, and attaches/detaches them via
//          banners.section_id — all without leaving the builder.
// USED IN: components/admin/HomepageSectionsAdmin.tsx
// ============================================

import * as React from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StorageUploader from "@/components/admin/StorageUploader";
import type { Banner } from "@/types";

type Props = {
  sectionId: string;
  initial: Banner[];
};

export default function HomepageSectionBannersEditor({
  sectionId,
  initial,
}: Props) {
  const [rows, setRows] = React.useState<Banner[]>(initial);
  const [adding, setAdding] = React.useState(false);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("banners")
      .select("*")
      .eq("section_id", sectionId)
      .order("sort_order", { ascending: true });
    setRows(((data as unknown) as Banner[]) ?? []);
  }

  async function move(id: string, direction: "up" | "down") {
    const ordered = [...rows].sort((a, b) => a.sort_order - b.sort_order);
    const idx = ordered.findIndex((r) => r.id === id);
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= ordered.length) return;
    const a = ordered[idx];
    const b = ordered[swap];
    const supabase = createClient();
    await supabase
      .from("banners")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id);
    await supabase
      .from("banners")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id);
    await refresh();
  }

  async function detach(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("banners")
      .update({ section_id: null })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Banner detached");
    await refresh();
  }

  async function deleteBanner(id: string) {
    if (!window.confirm("Delete this banner permanently?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Banner deleted");
    await refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="admin-section-title">Banners in this section</div>
          <div className="text-sm text-slate-500">
            {rows.length === 0
              ? "Upload an image to add the first banner."
              : `${rows.length} banner${rows.length === 1 ? "" : "s"} attached.`}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          <Plus className="mr-1 h-4 w-4" />
          {adding ? "Close" : "Add banner"}
        </Button>
      </div>

      {adding && (
        <BannerCreate
          sectionId={sectionId}
          nextSortOrder={
            rows.length > 0
              ? Math.max(...rows.map((r) => r.sort_order)) + 1
              : 1
          }
          onCreated={async () => {
            setAdding(false);
            await refresh();
          }}
        />
      )}

      {rows.length === 0 && !adding && (
        <div className="rounded-sm border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
          No banners yet.
        </div>
      )}

      <div className="space-y-3">
        {rows
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((banner, idx) => (
            <BannerEditor
              key={banner.id}
              banner={banner}
              onSaved={refresh}
              onDetach={() => void detach(banner.id)}
              onDelete={() => void deleteBanner(banner.id)}
              onMoveUp={() => void move(banner.id, "up")}
              onMoveDown={() => void move(banner.id, "down")}
              canMoveUp={idx > 0}
              canMoveDown={idx < rows.length - 1}
            />
          ))}
      </div>
    </div>
  );
}

HomepageSectionBannersEditor.displayName = "HomepageSectionBannersEditor";

// ============================================================
// Sub-component: upload form for a brand-new banner.
// ============================================================
function BannerCreate({
  sectionId,
  nextSortOrder,
  onCreated,
}: {
  sectionId: string;
  nextSortOrder: number;
  onCreated: () => Promise<void>;
}) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [cta, setCta] = React.useState("");
  const [clickUrl, setClickUrl] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!imageUrl) {
      toast.error("Upload an image first");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("banners").insert({
        image_url: imageUrl,
        title: title.trim() || null,
        subtitle: subtitle.trim() || null,
        cta_text: cta.trim() || null,
        click_url: clickUrl.trim() || null,
        placement: "section",
        section_id: sectionId,
        target_type: clickUrl.trim() ? "custom_url" : "none",
        sort_order: nextSortOrder,
        is_active: true,
      });
      if (error) throw error;
      toast.success("Banner added");
      await onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-blue-100 bg-blue-50/30 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <StorageUploader
            label="Banner image"
            folder={`banners/${sectionId}`}
            value={imageUrl}
            onChange={setImageUrl}
          />
        </div>
        <div className="space-y-1">
          <Label>Title</Label>
          <Input
            className="admin-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mega Sale"
          />
        </div>
        <div className="space-y-1">
          <Label>Subtitle</Label>
          <Input
            className="admin-input"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Up to 50% off across the store"
          />
        </div>
        <div className="space-y-1">
          <Label>CTA text</Label>
          <Input
            className="admin-input"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Shop now"
          />
        </div>
        <div className="space-y-1">
          <Label>Click URL</Label>
          <Input
            className="admin-input"
            value={clickUrl}
            onChange={(e) => setClickUrl(e.target.value)}
            placeholder="/category/sale"
          />
        </div>
      </div>
      <div className="mt-4">
        <Button type="button" onClick={() => void save()} disabled={saving || !imageUrl}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Add banner"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: edit / delete / reorder a single banner.
// ============================================================
function BannerEditor({
  banner,
  onSaved,
  onDetach,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  banner: Banner;
  onSaved: () => Promise<void>;
  onDetach: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(banner.image_url);
  const [title, setTitle] = React.useState(banner.title ?? "");
  const [subtitle, setSubtitle] = React.useState(banner.subtitle ?? "");
  const [cta, setCta] = React.useState(banner.cta_text ?? "");
  const [clickUrl, setClickUrl] = React.useState(banner.click_url ?? "");
  const [isActive, setIsActive] = React.useState(banner.is_active);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!imageUrl) {
      toast.error("Image is required");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("banners")
        .update({
          image_url: imageUrl,
          title: title.trim() || null,
          subtitle: subtitle.trim() || null,
          cta_text: cta.trim() || null,
          click_url: clickUrl.trim() || null,
          target_type: clickUrl.trim() ? "custom_url" : "none",
          is_active: isActive,
        })
        .eq("id", banner.id);
      if (error) throw error;
      toast.success("Banner saved");
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        {imageUrl ? (
          <div className="relative h-24 w-full flex-shrink-0 overflow-hidden border border-slate-200 bg-slate-50 sm:h-20 sm:w-32">
            <Image
              src={imageUrl}
              alt={title || "Banner"}
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="grid h-20 w-32 flex-shrink-0 place-items-center border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
            no image
          </div>
        )}

        <div className="grid flex-1 gap-2 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              className="admin-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Subtitle</Label>
            <Input
              className="admin-input"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>CTA text</Label>
            <Input
              className="admin-input"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Click URL</Label>
            <Input
              className="admin-input"
              value={clickUrl}
              onChange={(e) => setClickUrl(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <StorageUploader
              label="Replace image"
              folder={`banners/${banner.section_id ?? "section"}`}
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>
        </div>

        <div className="flex flex-row gap-2 sm:flex-col">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Move up"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Move down"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Visible on storefront
        </label>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button type="button" onClick={() => void save()} disabled={saving}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDetach}
            title="Keep the banner but detach it from this section"
          >
            Detach
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={onDelete}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
