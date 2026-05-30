"use client";

// ============================================
// FILE: components/admin/CategoriesAdmin.tsx
// PURPOSE: Client CRUD UI for categories
// USED IN: app/admin/categories/page.tsx
// INTERN NOTE: Use Storage uploader for category image URLs.
// ============================================

import * as React from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StorageUploader from "@/components/admin/StorageUploader";
import type { Category } from "@/types";

type Props = { initial: Category[] };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function CategoriesAdmin({ initial }: Props) {
  const [rows, setRows] = React.useState<Category[]>(initial);
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [parentId, setParentId] = React.useState<string>("");
  const [msg, setMsg] = React.useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    setRows((data as unknown as Category[]) ?? []);
  }

  async function add() {
    setMsg(null);
    try {
      const supabase = createClient();
      const payload = {
        name,
        slug: slugify(name),
        parent_id: parentId || null,
        icon_emoji: icon || null,
        image_url: imageUrl,
        sort_order: rows.filter((row) => (row.parent_id ?? "") === parentId).length + 1,
        is_active: true,
      };
      const { error } = await supabase.from("categories").insert(payload);
      if (error) throw error;
      setName("");
      setIcon("");
      setImageUrl(null);
      setParentId("");
      await refresh();
      setMsg(parentId ? "Child category added" : "Category added");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const supabase = createClient();
    await supabase.from("categories").update({ is_active: !isActive }).eq("id", id);
    await refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    const children = rows.filter((row) => row.parent_id === id);
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (
      (children.length > 0 || (count ?? 0) > 0) &&
      !window.confirm("This category has child categories or products. Delete anyway?")
    ) {
      return;
    }

    await supabase.from("categories").delete().eq("id", id);
    await refresh();
  }

  const tree = React.useMemo(() => {
    const byId = new Map<string, Category & { children: Category[]; depth: number }>();
    rows.forEach((row) => byId.set(row.id, { ...row, children: [], depth: 0 }));

    const roots: (Category & { children: Category[]; depth: number })[] = [];
    byId.forEach((node) => {
      const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortNodes = (nodes: (Category & { children: Category[]; depth: number })[]) => {
      nodes.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
      nodes.forEach((node) => {
        node.children.forEach((child) => {
          (child as Category & { depth: number }).depth = node.depth + 1;
        });
        sortNodes(node.children as (Category & { children: Category[]; depth: number })[]);
      });
    };
    sortNodes(roots);
    return roots;
  }, [rows]);

  const flatOptions = React.useMemo(() => {
    const output: Array<Category & { depth: number }> = [];
    const visit = (nodes: Array<Category & { children: Category[]; depth: number }>) => {
      nodes.forEach((node) => {
        output.push(node);
        visit(node.children as Array<Category & { children: Category[]; depth: number }>);
      });
    };
    visit(tree);
    return output;
  }, [tree]);

  const selectedParent = rows.find((row) => row.id === parentId);

  function renderNode(node: Category & { children: Category[]; depth: number }) {
    return (
      <div key={node.id} className="space-y-3">
        <div
          className="admin-list-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ marginLeft: Math.min(node.depth, 5) * 14 }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
              {node.image_url ? (
                <Image src={node.image_url} alt={node.name} fill sizes="44px" className="object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-lg">
                  {node.icon_emoji ?? "▣"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium">{node.name}</div>
                <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  Level {node.depth + 1}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">/{node.slug}</div>
              {node.children.length > 0 && (
                <div className="text-xs text-blue-600">
                  {node.children.length} child {node.children.length === 1 ? "category" : "categories"}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setParentId(node.id)}>
              Add child
            </Button>
            <Button type="button" variant="outline" onClick={() => toggleActive(node.id, node.is_active)}>
              {node.is_active ? "Disable" : "Enable"}
            </Button>
            <Button type="button" variant="destructive" onClick={() => remove(node.id)}>
              Delete
            </Button>
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="space-y-3">
            {(node.children as Array<Category & { children: Category[]; depth: number }>).map(renderNode)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-5">
        <div>
          <div className="admin-section-title">Category Tree</div>
          <div className="admin-heading mt-1">Add category or child category</div>
          <p className="admin-subtle mt-2">Build root categories, subcategories, and deeper nested product groups from one place.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-3">
            <Label>Parent category</Label>
            <select
              className="admin-input h-10 w-full px-3 text-sm"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Root category</option>
              {flatOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {"— ".repeat(category.depth)}
                  {category.name}
                </option>
              ))}
            </select>
            {selectedParent && (
              <div className="text-xs text-blue-600">
                New category will be created under {selectedParent.name}.
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Electronics" />
          </div>
          <div className="space-y-2">
            <Label>Icon emoji (optional)</Label>
            <Input className="admin-input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon or short label" />
          </div>
          <div className="md:col-span-3">
            <StorageUploader label="Category image (optional)" folder="categories" value={imageUrl} onChange={setImageUrl} />
          </div>
          {imageUrl && (
            <div className="md:col-span-3">
              <div className="admin-list-row flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-sm bg-muted">
                  <Image src={imageUrl} alt="Category preview" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Preview</div>
                  <div className="truncate text-xs text-muted-foreground">{imageUrl}</div>
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
            <div className="admin-section-title">Collection Hierarchy</div>
            <div className="admin-heading mt-1">Existing category tree</div>
          </div>
          <div className="admin-subtle">{rows.length} total nodes</div>
        </div>
        <div className="mt-4 space-y-3">
          {tree.map(renderNode)}
          {rows.length === 0 && (
            <div className="text-sm text-muted-foreground">No categories yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

CategoriesAdmin.displayName = "CategoriesAdmin";

