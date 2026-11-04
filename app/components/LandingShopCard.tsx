import type { LandingProvider } from "@/lib/landing-data";
import TierBadge from "./TierBadge";
import { ArrowUpRightIcon } from "./icons";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function LandingShopCard({ shop }: { shop: LandingProvider }) {
  const bookHref = shop.bookingUrl ?? shop.website ?? undefined;
  return (
    <div className="rounded-2xl bg-white border border-stone-200/80 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-ink leading-tight">
            {shop.name}
          </h3>
          <p className="text-xs text-stone-400 mt-1">{shop.address}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium text-stone-500">
            {"$".repeat(shop.priceTier)}
            <span className="text-stone-300">
              {"$".repeat(4 - shop.priceTier)}
            </span>
          </span>
          <TierBadge tier={shop.tier === "live" ? "live" : "listed"} />
        </div>
      </div>

      {shop.services.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {shop.services.slice(0, 4).map((s) => (
            <li key={s.name} className="text-xs text-stone-500">
              <span className="font-semibold text-ink">{s.name}</span>{" "}
              {formatPrice(s.priceCents)} · {s.durationMin}min
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
        {bookHref && (
          <a
            href={bookHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="btn-gradient inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold"
          >
            Book
            <ArrowUpRightIcon size={11} strokeWidth={2.5} />
          </a>
        )}
        {shop.phone && (
          <a
            href={`tel:${shop.phone.replace(/[^+\d]/g, "")}`}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-white border border-stone-200 text-ink hover:border-violet-300 transition-colors"
          >
            {shop.phone}
          </a>
        )}
      </div>
    </div>
  );
}
