"use client";

import type { RankedResult } from "@/lib/types";
import Monogram from "./Monogram";

function minutesUntil(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 60000);
}

function formatRelativeTime(iso: string): string {
  const min = minutesUntil(iso);
  if (min < 0) return "Now";
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

function TimeChip({ startsAt }: { startsAt: string }) {
  const min = minutesUntil(startsAt);
  const isHot = min >= 0 && min <= 90;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded-full flex-shrink-0 ${
        isHot
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-accent-light text-primary-dark ring-1 ring-violet-100"
      }`}
    >
      {isHot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
      )}
      {formatRelativeTime(startsAt)}
    </span>
  );
}

function PriceTier({ tier }: { tier: number }) {
  return (
    <span className="text-xs font-medium text-stone-500">
      {"$".repeat(tier)}
      <span className="text-stone-300">{"$".repeat(4 - tier)}</span>
    </span>
  );
}

function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="text-amber-400">★</span>
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
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
    <div className="p-3 space-y-2.5">
      {results.map((r, i) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className="animate-fade-up card-hover w-full text-left rounded-2xl bg-white border border-stone-200/80 px-4 py-3.5"
          style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0 mt-0.5">
              <Monogram name={r.name} size={42} />
              <div
                className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white ${
                  i < 3 ? "bg-ink text-white" : "bg-stone-200 text-stone-600"
                }`}
              >
                {i + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-[15px] leading-tight text-ink min-w-0">
                  {r.name}
                </h3>
                {r.soonestSlot && <TimeChip startsAt={r.soonestSlot.startsAt} />}
              </div>
              <p className="text-xs text-stone-400 mt-1 truncate">{r.address}</p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
                <Stars rating={r.ratingAvg} count={r.ratingCount} />
                {r.distanceKm !== undefined && (
                  <span className="text-xs text-stone-500 font-medium">
                    {r.distanceKm < 1
                      ? `${Math.round(r.distanceKm * 1000)}m`
                      : `${r.distanceKm.toFixed(1)} km`}
                  </span>
                )}
                <PriceTier tier={r.priceTier} />
                {r.source !== "mock" && (
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">
                    {r.source}
                  </span>
                )}
                <span className="text-[11px] text-primary-dark/70 bg-accent-light px-2 py-0.5 rounded-full font-medium">
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
