"use client";

// ============================================
// FILE: components/admin/SiteSettingsForm.tsx
// PURPOSE: Client form to update the single site_settings row
// USED IN: app/admin/site/page.tsx
// INTERN NOTE: Safe to add new fields if DB table adds columns.
// ============================================

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StorageUploader from "@/components/admin/StorageUploader";
import { normalizeWhatsAppPhone } from "@/utils/store/whatsapp";
import type { BrandSettings, SiteSettings } from "@/types";

type Props = { initial: SiteSettings | null; brandInitial: BrandSettings | null };

export default function SiteSettingsForm({ initial, brandInitial }: Props) {
  const [siteName, setSiteName] = React.useState(initial?.site_name ?? "");
  const [logoUrl, setLogoUrl] = React.useState<string | null>(initial?.logo_url ?? null);
  const [footerCopyrightName, setFooterCopyrightName] = React.useState(() => {
    const raw = (initial?.footer_copyright ?? "").trim();
    if (!raw) return "";
    // Accept both "© Brand" and "©Brand" from older saves.
    const withoutSymbol = raw.startsWith("©") ? raw.slice(1) : raw;
    return withoutSymbol.trim();
  });
  const [metaTitle, setMetaTitle] = React.useState(initial?.meta_title ?? "");
  const [metaDesc, setMetaDesc] = React.useState(initial?.meta_desc ?? "");
  const [ogImage, setOgImage] = React.useState<string | null>(initial?.og_image ?? null);
  const [gaId, setGaId] = React.useState<string>(initial?.ga_id ?? "");
  const [whatsapp, setWhatsapp] = React.useState(initial?.whatsapp ?? "");

  const [tagline, setTagline] = React.useState(brandInitial?.tagline ?? "");
  const [instagram, setInstagram] = React.useState(brandInitial?.instagram ?? "");
  const [youtube, setYoutube] = React.useState(brandInitial?.youtube ?? "");
  const [facebook, setFacebook] = React.useState(brandInitial?.facebook ?? "");

  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

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
      return "Save failed";
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const normalizedWhatsapp = normalizeWhatsAppPhone(whatsapp);
      if (!normalizedWhatsapp) {
        throw new Error("Enter a valid WhatsApp number (10 digits or 91XXXXXXXXXX).");
      }

      const supabase = createClient();
      const payload = {
        site_name: siteName,
        logo_url: logoUrl,
        footer_copyright: footerCopyrightName.trim()
          ? `© ${footerCopyrightName.trim()}`
          : null,
        meta_title: metaTitle,
        meta_desc: metaDesc,
        og_image: ogImage,
        ga_id: gaId || null,
        whatsapp: normalizedWhatsapp,
        // site_settings is a singleton; this guarantees "update-or-create" behavior.
        singleton_guard: true,
      };

      const { error: settingsErr } = await supabase
        .from("site_settings")
        .upsert(payload, { onConflict: "singleton_guard" });
      if (settingsErr) throw settingsErr;

      const brandPayload = {
        tagline: tagline.trim() ? tagline.trim() : null,
        instagram: instagram.trim() ? instagram.trim() : null,
        youtube: youtube.trim() ? youtube.trim() : null,
        facebook: facebook.trim() ? facebook.trim() : null,
      };

      if (brandInitial?.id) {
        const { error } = await supabase
          .from("brand_settings")
          .update(brandPayload)
          .eq("id", brandInitial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_settings").insert(brandPayload);
        if (error) throw error;
      }

      setMsg("Saved!");
    } catch (e) {
      setMsg(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-5">
        <div>
          <div className="admin-section-title">Brand Control</div>
          <div className="admin-heading mt-1">Site settings</div>
          <p className="admin-subtle mt-2">Update identity, SEO, contact details, and storefront sharing assets.</p>
        </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Site name</Label>
          <Input className="admin-input" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>WhatsApp (91XXXXXXXXXX)</Label>
          <Input
            className="admin-input"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            inputMode="tel"
            placeholder="1234567890 or 911234567890"
          />
          <p className="text-xs text-muted-foreground">
            Saved format: {normalizeWhatsAppPhone(whatsapp) ?? "invalid number"}
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Footer copyright (optional)</Label>
          <div className="flex items-center overflow-hidden rounded-sm border bg-white shadow-sm">
            <div className="flex h-10 items-center border-r bg-muted px-3 text-sm text-muted-foreground">
              ©
            </div>
            <Input
              className="h-10 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={footerCopyrightName}
              onChange={(e) => setFooterCopyrightName(e.target.value)}
              placeholder={siteName || "ShopKart"}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Preview:{" "}
              <span className="font-medium text-foreground">
              © {footerCopyrightName.trim() || siteName || "ShopKart"}
            </span>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Meta title</Label>
          <Input className="admin-input" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Meta description</Label>
          <Input className="admin-input" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>GA ID (optional)</Label>
          <Input className="admin-input" value={gaId} onChange={(e) => setGaId(e.target.value)} placeholder="G-XXXXXXX" />
        </div>
      </div>

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
          <StorageUploader label="Logo upload" folder="logos" value={logoUrl} onChange={setLogoUrl} />
          <StorageUploader label="Background banner image" folder="backgrounds" value={ogImage} onChange={setOgImage} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          This image is used as the global site background theme and as fallback SEO OpenGraph image.
        </p>
      </div>

      <div className="admin-panel p-5">
        <div>
          <div className="admin-section-title">Social Presence</div>
          <div className="admin-heading mt-1">Footer social links</div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Tagline (optional)</Label>
            <Input className="admin-input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Great deals, everyday low prices" />
          </div>
          <div className="space-y-2">
            <Label>Instagram URL</Label>
            <Input className="admin-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <Label>YouTube URL</Label>
            <Input className="admin-input" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Facebook URL</Label>
            <Input className="admin-input" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
        </div>
      </div>

      <div className="admin-panel-flat flex flex-wrap items-center gap-3 p-4">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
        {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
      </div>
    </div>
  );
}

SiteSettingsForm.displayName = "SiteSettingsForm";

