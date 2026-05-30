// ============================================
// FILE: app/admin/page.tsx
// PURPOSE: Admin dashboard (quick links + health checks)
// USED IN: /admin
// INTERN NOTE: If data is missing, check Supabase tables + env vars.
// ============================================

import AdminShell from "@/components/admin/AdminShell";
import { getCategories, getProducts, getBanners } from "@/utils/store/queries";
import Link from "next/link";
import {
  ArrowUpRight,
  ImageIcon,
  Package,
  Tags,
} from "lucide-react";

export const dynamic = "force-dynamic";

const formatter = new Intl.NumberFormat("en-IN");

export default async function AdminDashboard() {
  const [categories, products, banners] = await Promise.all([
    getCategories(),
    getProducts(),
    getBanners(),
  ]);

  const activeCategories = categories.filter((category) => category.is_active).length;
  const featuredProducts = products.filter((product) => product.is_featured).length;
  const inStockProducts = products.filter((product) => product.in_stock).length;
  const activeBanners = banners.filter((banner) => banner.is_active).length;

  const metrics = [
    {
      label: "Categories",
      value: formatter.format(categories.length),
      detail: `${formatter.format(activeCategories)} active collections`,
      icon: Tags,
      href: "/admin/categories",
    },
    {
      label: "Products",
      value: formatter.format(products.length),
      detail: `${formatter.format(inStockProducts)} in stock, ${formatter.format(featuredProducts)} featured`,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Banners",
      value: formatter.format(banners.length),
      detail: `${formatter.format(activeBanners)} active storefront banners`,
      icon: ImageIcon,
      href: "/admin/banners",
    },
  ];

  const quickLinks = [
    { label: "Update site identity", href: "/admin/site", meta: "Logo, SEO, WhatsApp, footer" },
    { label: "Add products", href: "/admin/products", meta: "Images, pricing, stock, featured" },
    { label: "Curate homepage banners", href: "/admin/banners", meta: "Hero visuals and call-to-actions" },
    { label: "Track orders", href: "/admin/orders", meta: "Payment and fulfillment status" },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              key={metric.label}
              href={metric.href}
              className="admin-panel-flat admin-card-hover admin-enter block min-w-0 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {metric.label}
                  </div>
                  <div className="mt-2 line-clamp-2 break-words text-xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-2xl">
                    {metric.value}
                  </div>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-blue-100 bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-500">{metric.detail}</div>
            </Link>
          );
        })}
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="admin-panel p-4 sm:p-5">
          <div className="admin-section-title">Quick Actions</div>
          <div className="mt-4 space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="admin-list-row flex items-center justify-between gap-4"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-950">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">{link.meta}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-panel p-4 sm:p-5">
          <div className="admin-section-title">Operations Snapshot</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Catalog</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {formatter.format(products.length + categories.length)}
              </div>
              <div className="mt-1 text-xs text-slate-500">products + categories</div>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Homepage</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {formatter.format(activeBanners)}
              </div>
              <div className="mt-1 text-xs text-slate-500">visible banners</div>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Stock</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {formatter.format(inStockProducts)}
              </div>
              <div className="mt-1 text-xs text-slate-500">sellable items</div>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

