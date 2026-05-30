// ============================================
// FILE: components/admin/InvoiceDocument.tsx
// PURPOSE: PDF document used by /api/invoices/[orderId]
//          (server-rendered with @react-pdf/renderer).
// USED IN: app/api/invoices/[orderId]/route.ts
// INTERN NOTE: Edit branding/typography here, not in the API
//              route, to keep concerns separated.
// ============================================

import * as React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Invoice, Order, OrderItem, SiteSettings } from "@/types";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  brandName: { fontSize: 18, fontWeight: 700, color: "#0f172a" },
  small: { color: "#64748b", fontSize: 9 },
  hr: { borderBottom: "1pt solid #e2e8f0", marginVertical: 12 },
  invoiceTitle: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", gap: 24 },
  block: { flexBasis: "48%" },
  label: { fontSize: 9, color: "#64748b", marginBottom: 2, textTransform: "uppercase" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: "0.5pt solid #e2e8f0",
  },
  cellName: { flex: 3 },
  cellQty: { flex: 0.6, textAlign: "right" },
  cellPrice: { flex: 1, textAlign: "right" },
  cellTotal: { flex: 1, textAlign: "right" },
  totals: {
    marginTop: 12,
    alignSelf: "flex-end",
    width: 240,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsBig: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTop: "0.5pt solid #0f172a",
    marginTop: 4,
    fontWeight: 700,
    fontSize: 12,
  },
  footerNote: {
    marginTop: 24,
    color: "#475569",
    fontSize: 9,
    lineHeight: 1.5,
  },
});

type Props = {
  invoice: Invoice;
  order: Order;
  items: OrderItem[];
  settings: SiteSettings;
};

function fINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number.isFinite(value) ? value : 0);
}

export default function InvoiceDocument({
  invoice,
  order,
  items,
  settings,
}: Props) {
  const businessName =
    settings.business_name?.trim() || settings.site_name || "My Store";
  const businessAddress = settings.business_address ?? "";
  const businessEmail = settings.business_email ?? "";
  const businessPhone = settings.business_phone ?? "";
  const billingName =
    invoice.billing_name ?? order.customer_name ?? "Customer";
  const billingAddress =
    invoice.billing_address ?? order.shipping_address ?? "";
  const billingPhone = invoice.billing_phone ?? order.customer_phone ?? "";
  const billingEmail = invoice.billing_email ?? order.customer_email ?? "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandName}>{businessName}</Text>
            {businessAddress && <Text style={styles.small}>{businessAddress}</Text>}
            {businessPhone && <Text style={styles.small}>Phone: {businessPhone}</Text>}
            {businessEmail && <Text style={styles.small}>Email: {businessEmail}</Text>}
            {settings.gstin && (
              <Text style={styles.small}>GSTIN: {settings.gstin}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.small}>{invoice.invoice_number}</Text>
            {invoice.issued_at && (
              <Text style={styles.small}>
                Date: {new Date(invoice.issued_at).toLocaleDateString()}
              </Text>
            )}
            <Text style={styles.small}>Order: {order.id.slice(0, 8)}</Text>
          </View>
        </View>

        <View style={styles.hr} />

        <View style={styles.twoCol}>
          <View style={styles.block}>
            <Text style={styles.label}>Bill to</Text>
            <Text>{billingName}</Text>
            {billingAddress ? <Text>{billingAddress}</Text> : null}
            {billingPhone ? <Text>{billingPhone}</Text> : null}
            {billingEmail ? <Text>{billingEmail}</Text> : null}
            {invoice.gstin ? <Text>GSTIN: {invoice.gstin}</Text> : null}
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Payment</Text>
            <Text>
              {(order.payment_method ?? "razorpay").toUpperCase()} ·{" "}
              {(order.payment_status ?? "pending").toUpperCase()}
            </Text>
            {order.razorpay_payment_id ? (
              <Text>Ref: {order.razorpay_payment_id}</Text>
            ) : null}
            {order.coupon_code ? <Text>Coupon: {order.coupon_code}</Text> : null}
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellName}>Item</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Price</Text>
            <Text style={styles.cellTotal}>Total</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.cellName}>
                <Text>{item.product_name}</Text>
                {item.selected_options &&
                Object.keys(item.selected_options).length > 0 ? (
                  <Text style={styles.small}>
                    {Object.entries(item.selected_options)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" • ")}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.cellQty}>{item.qty}</Text>
              <Text style={styles.cellPrice}>{fINR(Number(item.sell_price))}</Text>
              <Text style={styles.cellTotal}>{fINR(Number(item.line_total))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{fINR(Number(invoice.subtotal))}</Text>
          </View>
          {Number(invoice.discount_amount ?? 0) > 0 && (
            <View style={styles.totalsRow}>
              <Text>Discount</Text>
              <Text>- {fINR(Number(invoice.discount_amount))}</Text>
            </View>
          )}
          {Number(invoice.tax_rate ?? 0) > 0 && (
            <View style={styles.totalsRow}>
              <Text>
                GST ({Number(invoice.tax_rate).toFixed(2)}%)
                {settings.prices_tax_inclusive !== false ? " (incl.)" : ""}
              </Text>
              <Text>{fINR(Number(invoice.tax_amount))}</Text>
            </View>
          )}
          <View style={styles.totalsBig}>
            <Text>Total</Text>
            <Text>{fINR(Number(invoice.total))}</Text>
          </View>
        </View>

        {settings.prices_tax_inclusive !== false &&
          Number(invoice.tax_rate ?? 0) > 0 && (
            <Text style={styles.footerNote}>
              Prices shown are inclusive of GST. The figures above show the
              taxable base and the GST extracted from the all-inclusive amount.
            </Text>
          )}

        {settings.invoice_terms && (
          <Text style={styles.footerNote}>{settings.invoice_terms}</Text>
        )}
      </Page>
    </Document>
  );
}
