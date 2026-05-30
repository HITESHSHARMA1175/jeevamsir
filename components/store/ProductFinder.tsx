"use client";

import type { Category } from "@/types";
import { Search } from "lucide-react";
import { useState } from "react";

export default function ProductFinder({ categories }: { categories: Category[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const handleSearch = () => {
    // Build query string
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedPrice) params.set("price", selectedPrice);
    if (selectedType) params.set("type", selectedType);

    // Navigate to products page with filters
    const queryString = params.toString();
    window.location.href = `/products${queryString ? "?" + queryString : ""}`;
  };

  const priceRanges = [
    { label: "Under ₹500", value: "0-500" },
    { label: "₹500 - ₹1000", value: "500-1000" },
    { label: "₹1000 - ₹2000", value: "1000-2000" },
    { label: "₹2000 - ₹5000", value: "2000-5000" },
    { label: "Above ₹5000", value: "5000+" },
  ];

  const productTypes = [
    { label: "Bracelets", value: "bracelet" },
    { label: "Malas", value: "mala" },
    { label: "Loose Beads", value: "beads" },
    { label: "Jewelry", value: "jewelry" },
    { label: "Home Decor", value: "decor" },
  ];

  return (
    <section className="container-pad">
      <div className="rounded-[1rem] border border-[#eadfce] bg-[#f8f1e7] p-4 shadow-[0_14px_36px_rgba(80,43,43,0.1)] sm:p-6">
        <div className="space-y-4">
          <div>
            <p className="ornate-kicker">Quick discovery</p>
            <p className="mt-1 text-base font-semibold text-slate-900">Find the right spiritual product</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs font-medium text-slate-700">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-[0.55rem] border border-[#dbc8ad] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Type Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="type" className="text-xs font-medium text-slate-700">
                Product Type
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-[0.55rem] border border-[#dbc8ad] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                <option value="">Select Product Type</option>
                {productTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="price" className="text-xs font-medium text-slate-700">
                Price Range
              </label>
              <select
                id="price"
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full rounded-[0.55rem] border border-[#dbc8ad] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                <option value="">Select Price</option>
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="flex w-full items-center justify-center gap-2 rounded-[0.55rem] bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-primary-hover)] hover:shadow-lg active:scale-95"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
