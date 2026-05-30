"use client";

// ============================================
// FILE: components/admin/MultiImageUploader.tsx
// PURPOSE: Upload up to N (default 6) product images with
//          per-slot preview, remove, reorder (move left/right),
//          and "set as cover" controls. The first slot is treated
//          as the product's cover thumbnail (image_url).
// USED IN: components/admin/ProductsAdmin.tsx
// INTERN NOTE: Bucket is "public"; folder defaults to "products".
// ============================================

import * as React from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Star,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  folder?: string;
  label?: string;
};

function fileExt(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "png";
}

export default function MultiImageUploader({
  value,
  onChange,
  max = 6,
  folder = "products",
  label = "Product images (up to 6)",
}: Props) {
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const slots = React.useMemo(() => {
    const filled = value.slice(0, max);
    while (filled.length < max) filled.push("");
    return filled;
  }, [value, max]);

  async function uploadFile(file: File, targetIndex: number) {
    setError(null);
    setUploadingIndex(targetIndex);
    try {
      const supabase = createClient();
      const path = `${folder}/${crypto.randomUUID()}.${fileExt(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from("public")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("public").getPublicUrl(path);
      const next = value.slice();
      // If targetIndex < current length, replace at that index, else append.
      if (targetIndex < next.length) {
        next[targetIndex] = data.publicUrl;
      } else {
        next.push(data.publicUrl);
      }
      onChange(next.filter(Boolean).slice(0, max));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingIndex(null);
    }
  }

  function handleFiles(files: FileList | null, startIndex: number) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    let nextIndex = startIndex;
    list.forEach((file) => {
      // Sequential uploads for predictable order; capped at max.
      if (value.length + (nextIndex >= value.length ? 1 : 0) > max) return;
      void uploadFile(file, nextIndex);
      nextIndex += 1;
    });
  }

  function remove(index: number) {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = value.slice();
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    onChange(next);
  }

  function setAsCover(index: number) {
    if (index === 0) return;
    const next = value.slice();
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </div>
        <div className="text-xs text-slate-500">
          {value.length}/{max} • first image is the product thumbnail
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, value.length);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {slots.map((url, index) => {
          const isFilled = !!url;
          const isCover = index === 0 && isFilled;
          const isUploading = uploadingIndex === index;

          return (
            <div
              key={index}
              className={`relative aspect-square overflow-hidden rounded-sm border ${
                isCover ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"
              } bg-slate-50`}
            >
              {isFilled ? (
                <>
                  <Image
                    src={url}
                    alt={`Product image ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 33vw, 16vw"
                    className="object-cover"
                  />

                  {isCover && (
                    <div className="pointer-events-none absolute left-1 top-1 inline-flex items-center gap-1 rounded-sm bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      <Star className="h-3 w-3" /> Cover
                    </div>
                  )}

                  <div className="absolute inset-x-1 bottom-1 grid grid-cols-4 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="grid h-7 place-items-center rounded-sm bg-white/95 text-slate-700 shadow disabled:opacity-40"
                      aria-label="Move left"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index >= value.length - 1}
                      className="grid h-7 place-items-center rounded-sm bg-white/95 text-slate-700 shadow disabled:opacity-40"
                      aria-label="Move right"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAsCover(index)}
                      disabled={isCover}
                      className="grid h-7 place-items-center rounded-sm bg-white/95 text-slate-700 shadow disabled:opacity-40"
                      aria-label="Set as cover"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="grid h-7 place-items-center rounded-sm bg-rose-50 text-rose-700 shadow"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isUploading || index > value.length}
                  onClick={() => inputRef.current?.click()}
                  className="absolute inset-0 grid place-items-center text-xs text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex flex-col items-center gap-1">
                      <Upload className="h-4 w-4" />
                      <span>Add</span>
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={value.length >= max}
        >
          <Upload className="mr-2 h-4 w-4" /> Upload images
        </Button>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        )}
      </div>

      {error && <div className="text-xs text-rose-600">{error}</div>}
    </div>
  );
}

MultiImageUploader.displayName = "MultiImageUploader";
