"use client";

// ============================================
// FILE: components/admin/BillingAdmin.tsx
// PURPOSE: KPIs + invoice list + invoice settings (GSTIN, prefix,
//          tax rate, business identity, terms).
// USED IN: app/admin/billing/page.tsx
// ============================================

import * as React from "react";
import { Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "@/utils/store/formatPrice";
import type { Invoice, Order, SiteSettings } from "@/types";

type Props = {
  invoices: Invoice[];
  orders: Order[];
  settings: SiteSettings | null;
};

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

export default function BillingAdmin({
  invoices: initialInvoices,
  orders,
  settings,
}: Props) {
  const [invoices, setInvoices] = React.useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = React.useState("");
  const [paid, setPaid] = React.useState<"all" | "paid" | "pending">("all");

  const orderById = React.useMemo(() => {
    const map = new Map<string, Order>();
    orders.forEach((order) => map.set(order.id, order));
    return map;
  }, [orders]);

  // KPIs derived from invoices.
  const kpis = React.useMemo(() => {
    const todayStart = startOfDay().getTime();
    const monthStart = startOfMonth().getTime();
    let revenueToday = 0;
    let revenueMonth = 0;
    let taxCollected = 0;
    let paidCount = 0;
    let pendingCount = 0;
    invoices.forEach((inv) => {
      const ts = inv.issued_at ? new Date(inv.issued_at).getTime() : 0;
      const total = Number(inv.total ?? 0);
      taxCollected += Number(inv.tax_amount ?? 0);
      if (ts >= todayStart) revenueToday += total;
      if (ts >= monthStart) revenueMonth += total;
      const order = orderById.get(inv.order_id);
      if (order?.payment_status === "paid") paidCount += 1;
      else pendingCount += 1;
    });
    return { revenueToday, revenueMonth, taxCollected, paidCount, pendingCount };
  }, [invoices, orderById]);

  const filtered = invoices.filter((inv) => {
    const order = orderById.get(inv.order_id);
    const status = order?.payment_status ?? "pending";
    if (paid === "paid" && status !== "paid") return false;
    if (paid === "pending" && status === "paid") return false;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      const haystack = [
        inv.invoice_number,
        inv.billing_email,
        inv.billing_name,
        order?.customer_email,
        order?.customer_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  async function markPaid(invoice: Invoice) {
    const order = orderById.get(invoice.order_id);
    if (!order) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", order.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Order ${order.id.slice(0, 8)} marked paid`);
    // Optimistic refresh of cached invoice list (just refresh from DB)
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("issued_at", { ascending: false })
      .limit(500);
    setInvoices(((data as unknown) as Invoice[]) ?? invoices);
  }

  return (
    <div className="admin-enter space-y-5">
      <BillingSettings initial={settings} />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Today's revenue" value={formatINR(kpis.revenueToday)} />
        <KpiCard label="This month" value={formatINR(kpis.revenueMonth)} />
        <KpiCard label="Tax collected" value={formatINR(kpis.taxCollected)} />
        <KpiCard label="Paid invoices" value={String(kpis.paidCount)} />
        <KpiCard label="Pending" value={String(kpis.pendingCount)} accent="warn" />
      </div>

      <div className="admin-panel p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="admin-section-title">Invoices</div>
            <div className="admin-heading mt-1">All invoices</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search invoice # or customer"
                className="admin-input h-10 w-72 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="admin-input h-10 px-3 text-sm"
              value={paid}
              onChange={(e) =>
                setPaid(e.target.value as "all" | "paid" | "pending")
              }
            >
              <option value="all">All</option>
              <option value="paid">Paid only</option>
              <option value="pending">Pending only</option>
            </select>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-sm border border-slate-200 bg-white">
          <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <div className="col-span-3">Invoice</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-right">Tax</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {filtered.map((inv) => {
            const order = orderById.get(inv.order_id);
            const isPaid = order?.payment_status === "paid";
            return (
              <div
                key={inv.id}
                className="grid grid-cols-12 items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm"
              >
                <div className="col-span-3">
                  <div className="font-semibold">{inv.invoice_number}</div>
                  <div className="text-xs text-muted-foreground">
                    {inv.issued_at
                      ? new Date(inv.issued_at).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <div className="col-span-3 min-w-0">
                  <div className="truncate">
                    {inv.billing_name ?? order?.customer_name ?? "Customer"}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {inv.billing_email ?? order?.customer_email ?? ""}
                  </div>
                </div>
                <div className="col-span-2 text-right font-medium">
                  {formatINR(Number(inv.total ?? 0))}
                </div>
                <div className="col-span-2 text-right text-muted-foreground">
                  {formatINR(Number(inv.tax_amount ?? 0))}
                </div>
                <div className="col-span-2 flex flex-wrap justify-end gap-2">
                  <a
                    href={`/api/invoices/${inv.order_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-sm border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Receipt className="h-3 w-3" /> View
                  </a>
                  {!isPaid && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void markPaid(inv)}
                    >
                      Mark paid
                    </Button>
                  )}
                  {(inv.billing_email || order?.customer_email) && (
                    <a
                      href={`mailto:${inv.billing_email ?? order?.customer_email}?subject=Your invoice ${encodeURIComponent(inv.invoice_number)}&body=Hi%20${encodeURIComponent(inv.billing_name ?? order?.customer_name ?? "")},%0A%0AYour%20invoice%20can%20be%20downloaded%20from%20your%20account.`}
                      className="text-xs font-semibold text-slate-700 hover:underline"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="border-t border-slate-100 px-4 py-8 text-center text-sm text-muted-foreground">
              No invoices found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "warn";
}) {
  return (
    <div
      className={`admin-panel-flat p-4 ${
        accent === "warn" ? "border-amber-200 bg-amber-50/60" : ""
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

function BillingSettings({ initial }: { initial: SiteSettings | null }) {
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
  const [gstin, setGstin] = React.useState(initial?.gstin ?? "");
  const [prefix, setPrefix] = React.useState(initial?.invoice_prefix ?? "INV-");
  const [taxRate, setTaxRate] = React.useState(
    String(initial?.tax_rate_default ?? 0),
  );
  const [taxInclusive, setTaxInclusive] = React.useState(
    initial?.prices_tax_inclusive !== false,
  );
  const [terms, setTerms] = React.useState(initial?.invoice_terms ?? "");
  const [saving, setSaving] = React.useState(false);

  if (!initial) {
    return (
      <div className="admin-panel p-5 text-sm text-muted-foreground">
        Site settings row missing. Save site settings first.
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
          business_name: businessName || null,
          business_address: businessAddress || null,
          business_phone: businessPhone || null,
          business_email: businessEmail || null,
          gstin: gstin || null,
          invoice_prefix: prefix || "INV-",
          tax_rate_default: Number(taxRate) || 0,
          prices_tax_inclusive: taxInclusive,
          invoice_terms: terms || null,
        })
        .eq("id", initial!.id);
      if (error) throw error;
      toast.success("Billing settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel p-5">
      <div className="admin-section-title">Billing</div>
      <div className="admin-heading mt-1">Invoice settings</div>
      <p className="admin-subtle mt-2">
        Used on every PDF invoice. The first save also activates auto-numbering
        with the prefix below.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
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
        <div className="space-y-2">
          <Label>GSTIN</Label>
          <Input
            className="admin-input"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            placeholder="29ABCDE1234F1Z5"
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
        <div className="space-y-2">
          <Label>Invoice number prefix</Label>
          <Input
            className="admin-input"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Default GST rate (%)</Label>
          <Input
            className="admin-input"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-start gap-3 rounded-sm border border-blue-100 bg-blue-50/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={taxInclusive}
              onChange={(e) => setTaxInclusive(e.target.checked)}
            />
            <span className="space-y-1">
              <span className="block font-semibold text-slate-950">
                Sell prices already include GST
              </span>
              <span className="block text-slate-600">
                When ON, the listed sell price is the all-in amount the
                customer pays. The invoice reverse-extracts the GST so the
                printed total exactly matches what was charged. When OFF, GST
                is added on top of the sell price (the invoice total will be
                higher than the listed price).
              </span>
            </span>
          </label>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Invoice terms (footer)</Label>
          <Textarea
            className="admin-input"
            rows={3}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Returns within 7 days. All prices include GST unless noted."
          />
        </div>
      </div>

      <div className="mt-4">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save billing settings"}
        </Button>
      </div>
    </div>
  );
}

BillingAdmin.displayName = "BillingAdmin";
