"use client";

// ============================================
// FILE: components/admin/StorageUploader.tsx
// PURPOSE: Upload images to Supabase Storage and return public URL
// USED IN: Admin forms (site settings, products, banners, categories)
// INTERN NOTE: Bucket is "public" by default. You can change it if needed.
// ============================================

import * as React from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  folder: string; // e.g. "logos", "products"
  value: string | null;
  onChange: (url: string | null) => void;
};

function fileExt(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "png";
}

/**
 * StorageUploader
 * Uploads a file to Supabase Storage and returns the public URL.
 */
export default function StorageUploader({ label, folder, value, onChange }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const bucket = "public";
      const path = `${folder}/${crypto.randomUUID()}.${fileExt(file.name)}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, contentType: file.type });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="file"
          accept="image/*"
          className="admin-input"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!value}
          onClick={() => onChange(null)}
        >
          Clear
        </Button>
      </div>

      {value && (
        <div className="space-y-2">
          <div className="relative aspect-[16/5] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
            <Image
              src={value}
              alt={label}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 700px"
              className="object-cover"
            />
          </div>
          <div className="break-all rounded-md border border-blue-100 bg-blue-50/70 p-2 text-xs text-blue-700">
            {value}
          </div>
        </div>
      )}

      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}

StorageUploader.displayName = "StorageUploader";

