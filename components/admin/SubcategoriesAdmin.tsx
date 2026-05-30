"use client";

// ============================================
// FILE: components/admin/SubcategoriesAdmin.tsx
// PURPOSE: Client CRUD UI for subcategories (under categories)
// USED IN: app/admin/subcategories/page.tsx
// ============================================

import * as React from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StorageUploader from "@/components/admin/StorageUploader";
import type { Category, Subcategory } from "@/types";

type Props = { categories: Category[]; initial: Subcategory[] };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

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

export default function SubcategoriesAdmin({ categories, initial }: Props) {
  const [rows, setRows] = React.useState<Subcategory[]>(initial);

  const [categoryId, setCategoryId] = React.useState<string>(
    categories[0]?.id ?? "",
  );
  const [name, setName] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("subcategories")
      .select("*")
      .order("sort_order", { ascending: true });
    setRows(((data as unknown) as Subcategory[]) ?? []);
  }

  async function add() {
    setMsg(null);
    try {
      if (!categoryId) throw new Error("Category is required");
      const supabase = createClient();
      const payload = {
        category_id: categoryId,
        name,
        slug: slugify(name),
        image_url: imageUrl,
        sort_order: rows.length + 1,
        is_active: true,
      };
      const { error } = await supabase.from("subcategories").insert(payload);
      if (error) throw error;
      setName("");
      setImageUrl(null);
      await refresh();
      setMsg("Subcategory added");
    } catch (e) {
      setMsg(getErrorMessage(e));
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const supabase = createClient();
    await supabase
      .from("subcategories")
      .update({ is_active: !isActive })
      .eq("id", id);
    await refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("subcategories").delete().eq("id", id);
    await refresh();
  }

  const categoriesById = React.useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-5">
        <div>
          <div className="admin-section-title">Nested Catalog</div>
          <div className="admin-heading mt-1">Add subcategory</div>
          <p className="admin-subtle mt-2">Organize products under parent categories with optional visual tiles.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Parent category</Label>
            <select
              className="admin-input h-10 w-full px-3 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">(select)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              className="admin-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Banarasi"
            />
          </div>
          <div className="md:col-span-3">
            <StorageUploader
              label="Subcategory image (optional)"
              folder="subcategories"
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>
          {imageUrl && (
            <div className="md:col-span-3">
              <div className="admin-list-row flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-sm bg-muted">
                  <Image
                    src={imageUrl}
                    alt="Subcategory preview"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Preview</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {imageUrl}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button type="button" onClick={add} disabled={!name.trim()}>
            Add
          </Button>
          {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
        </div>
      </div>

      <div className="admin-panel p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="admin-section-title">Subcollection Grid</div>
            <div className="admin-heading mt-1">Existing subcategories</div>
          </div>
          <div className="admin-subtle">{rows.length} subcategories</div>
        </div>
        <div className="mt-4 space-y-3">
          {rows.map((s) => (
            <div
              key={s.id}
              className="admin-list-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                  {s.image_url ? (
                    <Image
                      src={s.image_url}
                      alt={s.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {categoriesById.get(s.category_id)?.name ?? "Unknown category"} •{" "}
                    {s.slug}
                  </div>
                  {s.image_url && (
                    <div className="truncate text-xs text-muted-foreground">
                      {s.image_url}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleActive(s.id, s.is_active)}
                >
                  {s.is_active ? "Disable" : "Enable"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => remove(s.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No subcategories yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

SubcategoriesAdmin.displayName = "SubcategoriesAdmin";

