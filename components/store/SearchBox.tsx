"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/utils/store/formatPrice";

type SearchSuggestion = {
  id: string;
  type: "product" | "category" | "subcategory" | "brand";
  label: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
  price: number | null;
};

type Props = {
  defaultValue?: string;
};

export default function SearchBox({ defaultValue = "" }: Props) {
  const router = useRouter();
  const [query, setQuery] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);

  React.useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as { suggestions?: SearchSuggestion[] };
        setSuggestions(data.suggestions ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/");
      return;
    }
    setOpen(false);
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="relative w-full">
      <form action="/" method="GET" role="search" onSubmit={submitSearch}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="q"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search electronics, fashion and accessories"
            autoComplete="off"
            className="h-11 w-full rounded-full border-blue-100 bg-white/95 pl-11 pr-11 text-sm text-slate-950 shadow-[0_10px_28px_rgba(30,64,175,0.09)] placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[rgba(37,99,235,0.2)] sm:h-12"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {open && query.trim().length >= 2 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[1rem] border border-blue-100 bg-white shadow-[0_24px_70px_rgba(30,64,175,0.18)]"
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="border-b bg-blue-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            Suggested matches
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading && (
              <div className="px-3 py-4 text-sm text-slate-500">Searching...</div>
            )}

            {!loading &&
              suggestions.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[0.85rem] px-3 py-2.5 hover:bg-blue-50"
                >
                    <span className="relative grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] text-xs font-semibold uppercase text-[var(--brand-primary)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.label}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      item.type.slice(0, 2)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-950">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {item.subtitle}
                    </span>
                  </span>
                  {typeof item.price === "number" && (
                    <span className="flex-shrink-0 text-xs font-semibold text-slate-700">
                      {formatINR(item.price)}
                    </span>
                  )}
                </Link>
              ))}

            {!loading && suggestions.length === 0 && (
                <div className="px-3 py-4 text-sm text-slate-500">
                No direct matches. Press Enter to explore all categories.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={submitSearch}
            className="block w-full border-t bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-950 hover:bg-blue-50"
          >
            Explore &quot;{query.trim()}&quot;
          </button>
        </div>
      )}
    </div>
  );
}

SearchBox.displayName = "SearchBox";

