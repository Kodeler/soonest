"use client";

import type { RankedResult } from "@/lib/types";

function formatRelativeTime(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Now";
  const min = Math.floor(ms / 60000);
  if (min < 60) return `in ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) {
    const time = new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return hours < 4 ? `in ${hours}h · ${time}` : `Today ${time}`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return `Tomorrow ${new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PriceTier({ tier }: { tier: number }) {
  return (
    <span className="text-stone-400 text-xs">
      {"$".repeat(tier)}
      <span className="text-stone-200">{"$".repeat(4 - tier)}</span>
    </span>
  );
}

function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="text-amber-500">★</span>
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-stone-400">({count})</span>
    </span>
  );
}

interface Props {
  results: RankedResult[];
  onSelect: (id: string) => void;
}

export default function ResultsList({ results, onSelect }: Props) {
  return (
    <div className="divide-y divide-stone-100">
      {results.map((r, i) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className="w-full text-left px-4 py-4 hover:bg-white active:bg-stone-50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500 flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-tight min-w-0">
                  {r.name}
                </h3>
                {r.soonestSlot && (
                  <span className="text-xs font-semibold text-accent whitespace-nowrap bg-accent-light px-2 py-1 rounded-lg flex-shrink-0">
                    {formatRelativeTime(r.soonestSlot.startsAt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5 truncate">
                {r.address}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <Stars rating={r.ratingAvg} count={r.ratingCount} />
                {r.distanceKm !== undefined && (
                  <span className="text-xs text-stone-400">
                    {r.distanceKm < 1
                      ? `${Math.round(r.distanceKm * 1000)}m`
                      : `${r.distanceKm.toFixed(1)} km`}
                  </span>
                )}
                <PriceTier tier={r.priceTier} />
                {r.source !== "mock" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">
                    {r.source}
                  </span>
                )}
                <span className="text-[11px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                  {r.rankingReason}
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
