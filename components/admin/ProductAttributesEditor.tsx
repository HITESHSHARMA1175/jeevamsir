"use client";

// ============================================
// FILE: components/admin/ProductAttributesEditor.tsx
// PURPOSE: Edit a product's flexible attribute groups, e.g.
//   [{ label: "Size", options: ["S","M","L"] },
//    { label: "Type", options: ["Nepali","Indian"] }]
// USED IN: components/admin/ProductEditPanel.tsx
//          components/admin/ProductsAdmin.tsx (Add form)
// ============================================

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductAttributeGroup } from "@/types";

type Props = {
  value: ProductAttributeGroup[];
  onChange: (next: ProductAttributeGroup[]) => void;
};

export default function ProductAttributesEditor({ value, onChange }: Props) {
  const groups = Array.isArray(value) ? value : [];

  function setGroup(index: number, next: ProductAttributeGroup) {
    const copy = groups.slice();
    copy[index] = next;
    onChange(copy);
  }

  function removeGroup(index: number) {
    const copy = groups.slice();
    copy.splice(index, 1);
    onChange(copy);
  }

  function addGroup() {
    onChange([...groups, { label: "", options: [] }]);
  }

  return (
    <div className="space-y-3 rounded-sm border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="admin-section-title">Attributes</div>
          <div className="text-xs text-slate-500">
            Add groups like Size (S/M/L), Color (Red/Blue), Type (Nepali/Indian),
            Fabric, etc. Customers must pick one option per group before adding to
            cart.
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addGroup}>
          <Plus className="mr-1 h-4 w-4" /> Add group
        </Button>
      </div>

      {groups.length === 0 && (
        <div className="text-xs text-slate-500">
          No attribute groups yet. Add one to expose size/color/type pickers on
          the product page.
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group, gi) => (
          <AttributeGroupEditor
            key={gi}
            value={group}
            onChange={(next) => setGroup(gi, next)}
            onRemove={() => removeGroup(gi)}
          />
        ))}
      </div>
    </div>
  );
}

function AttributeGroupEditor({
  value,
  onChange,
  onRemove,
}: {
  value: ProductAttributeGroup;
  onChange: (next: ProductAttributeGroup) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = React.useState("");

  function addOption() {
    const next = draft.trim();
    if (!next) return;
    if (value.options.includes(next)) {
      setDraft("");
      return;
    }
    onChange({ ...value, options: [...value.options, next] });
    setDraft("");
  }

  function removeOption(index: number) {
    const copy = value.options.slice();
    copy.splice(index, 1);
    onChange({ ...value, options: copy });
  }

  return (
    <div className="space-y-3 rounded-sm border border-slate-200 bg-white p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <Label>Group label</Label>
          <Input
            className="admin-input"
            placeholder="Size, Color, Type, Fabric, ..."
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={onRemove}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Remove group
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        <div className="flex flex-wrap gap-2">
          {value.options.map((option, oi) => (
            <span
              key={`${option}-${oi}`}
              className="inline-flex items-center gap-1 rounded-sm border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
            >
              {option}
              <button
                type="button"
                onClick={() => removeOption(oi)}
                aria-label={`Remove ${option}`}
                className="rounded-full p-0.5 hover:bg-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {value.options.length === 0 && (
            <span className="text-xs text-slate-500">No options yet.</span>
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
                addOption();
              }
            }}
            placeholder="e.g. M, Red, Nepali"
          />
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

ProductAttributesEditor.displayName = "ProductAttributesEditor";
