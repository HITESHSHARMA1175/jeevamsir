import type { HomepageSection } from "@/types";

type Props = { section: HomepageSection };

export default function OfferTicker({ section }: Props) {
  const text = section.ticker_text || section.title;

  if (!text) return null;

  return (
    <section className="overflow-hidden border-y border-primary/30 bg-primary py-2 text-white shadow-[var(--shadow-soft)]">
      <div
        className="flex min-w-max gap-8 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-xs"
        style={{ animation: `offer-ticker ${section.ticker_speed || 28}s linear infinite` }}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} className="flex items-center gap-8">
            <span className="text-[var(--brand-accent)]">◆</span>
            <span>{text}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

OfferTicker.displayName = "OfferTicker";

