"use client";

// ============================================
// FILE: components/admin/OrdersAdmin.tsx
// PURPOSE: Client UI to triage orders. Adds:
//   * Accept Order (sets status -> packed, accepted_at = now)
//   * Cancel Order (confirm dialog -> status=cancelled,
//     cancelled_at = now, optional reason)
//   * Filter chips (All / New / Accepted / Cancelled / Delivered)
//   * Toast feedback (sonner)
// USED IN: app/admin/orders/page.tsx
// ============================================

import * as React from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/utils/store/formatPrice";
import type { Order, OrderItem, OrderStatus } from "@/types";

type Props = { initial: Order[]; initialItems: OrderItem[] };

const statuses: OrderStatus[] = [
  "created",
  "paid",
  "failed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

type ChipFilter = "all" | "new" | "accepted" | "cancelled" | "delivered";

const chipFilters: { id: ChipFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New / Pending" },
  { id: "accepted", label: "Accepted (packed/shipped)" },
  { id: "cancelled", label: "Cancelled" },
  { id: "delivered", label: "Delivered" },
];

function matchesChip(order: Order, chip: ChipFilter) {
  switch (chip) {
    case "all":
      return true;
    case "new":
      return order.status === "created" || order.status === "paid";
    case "accepted":
      return order.status === "packed" || order.status === "shipped";
    case "cancelled":
      return order.status === "cancelled";
    case "delivered":
      return order.status === "delivered";
  }
}

export default function OrdersAdmin({ initial, initialItems }: Props) {
  const [rows, setRows] = React.useState<Order[]>(initial);
  const [items, setItems] = React.useState<OrderItem[]>(initialItems);
  const [chip, setChip] = React.useState<ChipFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [paymentFilter, setPaymentFilter] = React.useState("all");
  const [confirming, setConfirming] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const orders = ((data as unknown) as Order[]) ?? [];
    setRows(orders);
    const ids = orders.map((order) => order.id);
    const { data: itemRows } = ids.length
      ? await supabase.from("order_items").select("*").in("order_id", ids)
      : { data: [] };
    setItems(((itemRows as unknown) as OrderItem[]) ?? []);
  }

  async function generateInvoice(orderId: string) {
    const response = await fetch(`/api/invoices/${orderId}`);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(payload?.error ?? "Failed to generate invoice");
    }
  }

  const itemsByOrder = React.useMemo(() => {
    const map = new Map<string, OrderItem[]>();
    items.forEach((item) => {
      const list = map.get(item.order_id) ?? [];
      list.push(item);
      map.set(item.order_id, list);
    });
    return map;
  }, [items]);

  const filteredRows = rows.filter((order) => {
    if (!matchesChip(order, chip)) return false;
    const statusOk = statusFilter === "all" || order.status === statusFilter;
    const paymentOk =
      paymentFilter === "all" || order.payment_method === paymentFilter;
    return statusOk && paymentOk;
  });

  const counts = React.useMemo(() => {
    const out: Record<ChipFilter, number> = {
      all: rows.length,
      new: 0,
      accepted: 0,
      cancelled: 0,
      delivered: 0,
    };
    rows.forEach((order) => {
      if (order.status === "created" || order.status === "paid") out.new += 1;
      if (order.status === "packed" || order.status === "shipped") out.accepted += 1;
      if (order.status === "cancelled") out.cancelled += 1;
      if (order.status === "delivered") out.delivered += 1;
    });
    return out;
  }, [rows]);

  async function setStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      if (status === "packed" || status === "shipped") {
        await generateInvoice(id);
      }
      toast.success(`Order updated to ${status}`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function acceptOrder(id: string) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({
          status: "packed",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      await generateInvoice(id);
      toast.success("Order accepted and marked as packed");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to accept order");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelOrder(id: string) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Order cancelled");
      setConfirming(null);
      setReason("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel order");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-enter space-y-5">
      <div className="admin-panel p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="admin-section-title">Order Operations</div>
            <div className="admin-heading mt-1">Fulfillment queue</div>
            <p className="admin-subtle mt-2">
              Accept new orders, update shipping status, and cancel with a
              reason. Customers see status updates live in their account.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refresh()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {chipFilters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChip(c.id)}
              className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
                chip === c.id
                  ? "border-blue-200 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"
              }`}
            >
              {c.label}
              <span
                className={`rounded-sm px-1.5 py-0.5 text-[10px] ${
                  chip === c.id
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {counts[c.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            className="admin-input h-10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="admin-input h-10"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All payment methods</option>
            <option value="cod">COD</option>
            <option value="razorpay">Razorpay</option>
            <option value="phonepe">PhonePe</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredRows.map((o) => {
          const isCreated = o.status === "created" || o.status === "paid";
          const isCancelled = o.status === "cancelled";
          const itemList = itemsByOrder.get(o.id) ?? [];

          return (
            <div key={o.id} className="admin-panel-flat admin-card-hover p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-950">
                      Order #{o.id.slice(0, 8)}
                    </div>
                    <span className="admin-status-pill">{o.status}</span>
                    <span className="admin-status-pill">
                      {o.payment_method ?? "razorpay"} ·{" "}
                      {o.payment_status ?? "pending"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {o.customer_name ?? "Customer"} •{" "}
                    {o.customer_phone ?? "phone missing"} •{" "}
                    {o.customer_email ?? "email missing"}
                  </div>
                  <div className="text-xs font-medium text-slate-700">
                    Subtotal{" "}
                    {formatINR(Number(o.subtotal_amount ?? o.total_amount))} ·
                    Discount {formatINR(Number(o.discount_amount ?? 0))} · Total{" "}
                    {formatINR(Number(o.total_amount))}
                  </div>
                  {o.cancellation_reason && (
                    <div className="text-xs text-rose-600">
                      Cancelled: {o.cancellation_reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isCreated && (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={busyId === o.id}
                      onClick={() => void acceptOrder(o.id)}
                    >
                      <Check className="mr-1 h-4 w-4" /> Accept
                    </Button>
                  )}
                  {!isCancelled && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50"
                      disabled={busyId === o.id}
                      onClick={() => {
                        setConfirming(o.id);
                        setReason("");
                      }}
                    >
                      <X className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                  )}
                  <select
                    className="admin-input h-9 px-2 text-sm"
                    value={o.status}
                    disabled={busyId === o.id}
                    onChange={(e) =>
                      void setStatus(o.id, e.target.value as OrderStatus)
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {confirming === o.id && (
                <div className="mt-3 rounded-sm border border-rose-200 bg-rose-50/60 p-3 text-sm">
                  <div className="font-semibold text-rose-700">
                    Confirm cancel order #{o.id.slice(0, 8)}?
                  </div>
                  <div className="mt-1 text-xs text-rose-600/80">
                    This sets status to <code>cancelled</code> and stamps
                    cancelled_at. If the customer paid via Razorpay, you must
                    refund manually from Razorpay.
                  </div>
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="admin-input mt-2 h-9 w-full px-2 text-sm"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={busyId === o.id}
                      onClick={() => void cancelOrder(o.id)}
                    >
                      Yes, cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirming(null)}
                    >
                      Keep order
                    </Button>
                  </div>
                </div>
              )}

              {o.shipping_address && (
                <div className="mt-4 border-l-2 border-blue-200 bg-blue-50/60 p-3 text-sm whitespace-pre-line text-muted-foreground">
                  {o.shipping_address}
                </div>
              )}

              <div className="mt-4 grid gap-2">
                {itemList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-0.5 border-t pt-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">
                        {item.product_name}{" "}
                        <span className="text-muted-foreground">x{item.qty}</span>
                      </div>
                      {item.selected_options &&
                        Object.keys(item.selected_options).length > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            {Object.entries(item.selected_options)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" • ")}
                          </div>
                        )}
                    </div>
                    <div className="font-medium">
                      {formatINR(Number(item.line_total))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredRows.length === 0 && (
          <div className="admin-panel-flat p-5 text-sm text-muted-foreground">
            No orders match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

OrdersAdmin.displayName = "OrdersAdmin";
