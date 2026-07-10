"use client";

import { useState, useEffect, useCallback } from "react";
import type { RankedResult } from "@/lib/types";
import SearchBar from "@/app/components/SearchBar";
import ResultsList from "@/app/components/ResultsList";
import MapView from "@/app/components/MapView";
import ProviderDetail from "@/app/components/ProviderDetail";
import BookingFlow from "@/app/components/BookingFlow";
import Confirmation from "@/app/components/Confirmation";
/* eslint-disable @next/next/no-img-element */

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  vertical: string;
}

type View = "search" | "results" | "detail" | "booking" | "confirmation";

function SpeedLines({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="30" y="8" width="70" height="7" rx="3.5" fill="#7c3aed" opacity="0.14" />
      <rect x="10" y="20" width="58" height="7" rx="3.5" fill="#7c3aed" opacity="0.22" />
      <rect x="44" y="32" width="40" height="7" rx="3.5" fill="#7c3aed" opacity="0.1" />
      <circle cx="4" cy="23.5" r="3.5" fill="#7c3aed" opacity="0.3" />
    </svg>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("search");
  const [results, setResults] = useState<RankedResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    providerName: string;
    slotTime: string;
    bookingUrl?: string;
  } | null>(null);

  const [searchParams, setSearchParams] = useState({
    lat: 43.6532,
    lng: -79.3832,
    radiusKm: 25,
    categorySlug: "",
    keyword: "",
    asap: false,
  });

  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "time" | "distance" | "rating">("score");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const handleSearch = useCallback(async (params: typeof searchParams) => {
    setLoading(true);
    setError(null);
    setSearchParams(params);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: params.lat,
          lng: params.lng,
          radiusKm: params.radiusKm,
          categorySlug: params.categorySlug || undefined,
          keyword: params.keyword || undefined,
          asap: params.asap,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResults(data.results);
      setView("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "time":
        if (!a.soonestSlot) return 1;
        if (!b.soonestSlot) return -1;
        return new Date(a.soonestSlot.startsAt).getTime() - new Date(b.soonestSlot.startsAt).getTime();
      case "distance":
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      case "rating":
        return b.ratingAvg - a.ratingAvg;
      default:
        return b.score - a.score;
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-violet-100/80 px-5 py-2.5 flex items-center justify-between">
        <button
          onClick={() => { setView("search"); setSelectedProvider(null); }}
          className="flex items-center"
        >
          <img src="/logo.png" alt="Soonest" className="h-9 sm:h-10 w-auto" />
        </button>
        {view === "results" && (
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-stone-500 font-medium">
              {results.length} open now
            </span>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {view === "search" && (
          <div className="hero-mesh relative flex-1 flex flex-col items-center justify-center px-4 py-14 overflow-hidden">
            <SpeedLines className="animate-drift absolute w-40 sm:w-56 top-16 -left-4 sm:left-[8%] -rotate-6" />
            <SpeedLines className="animate-drift-slow absolute w-32 sm:w-44 bottom-24 right-0 sm:right-[10%] rotate-[168deg]" />

            <div className="relative w-full max-w-2xl space-y-10">
              <div className="text-center space-y-5 animate-fade-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-primary-dark shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live availability across Toronto
                </div>
                <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl font-extrabold tracking-tight text-ink">
                  Whatever you need,
                  <br />
                  <span className="text-gradient">booked sooner.</span>
                </h1>
                <p className="text-stone-500 text-lg sm:text-xl max-w-lg mx-auto">
                  One search across massage, hair, dental, physio and more —
                  ranked by who can take you first.
                </p>
              </div>

              <div
                className="animate-fade-up rounded-3xl bg-white/90 backdrop-blur border border-violet-100 shadow-[0_24px_70px_-24px_rgba(109,40,217,0.35)] p-5 sm:p-7"
                style={{ animationDelay: "120ms" }}
              >
                <SearchBar
                  categories={categories}
                  onSearch={handleSearch}
                  loading={loading}
                  initialParams={searchParams}
                />
                {error && (
                  <div className="mt-4 text-center text-red-600 text-sm">{error}</div>
                )}
              </div>

              <div
                className="animate-fade-up flex items-center justify-center gap-6 sm:gap-10 text-center"
                style={{ animationDelay: "220ms" }}
              >
                {[
                  ["45+", "providers"],
                  ["2,000+", "open slots this week"],
                  ["<1 min", "to book"],
                ].map(([stat, label]) => (
                  <div key={label}>
                    <div className="text-xl sm:text-2xl font-extrabold text-ink">{stat}</div>
                    <div className="text-xs sm:text-sm text-stone-400 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "results" && (
          <div className="flex-1 flex flex-col">
            <div className="glass sticky top-[57px] z-10 border-b border-violet-100/60 px-4 py-3">
              <SearchBar
                categories={categories}
                onSearch={handleSearch}
                loading={loading}
                initialParams={searchParams}
                compact
              />
              <div className="flex items-center gap-2 pt-2.5 -mb-0.5 overflow-x-auto scrollbar-hide">
                <div className="flex gap-1.5 flex-shrink-0">
                  {(["score", "time", "distance", "rating"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                        sortBy === s
                          ? "btn-gradient text-white"
                          : "bg-white border border-stone-200 text-stone-500 hover:border-violet-200 hover:text-primary"
                      }`}
                    >
                      {s === "score" ? "Best match" : s === "time" ? "⚡ Soonest" : s === "distance" ? "Nearest" : "Top rated"}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex-shrink-0 md:hidden">
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-ink text-white whitespace-nowrap"
                  >
                    {showMap ? "☰ List" : "🗺 Map"}
                  </button>
                </div>
              </div>
            </div>

            {results.length === 0 && !loading ? (
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <div className="space-y-3 animate-fade-up">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-3xl">
                    🔍
                  </div>
                  <p className="text-ink text-lg font-semibold">No results found</p>
                  <p className="text-stone-400 text-sm max-w-xs mx-auto">
                    Try expanding your search radius or picking a different category
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex overflow-hidden" style={{ height: "calc(100dvh - 178px)", flex: "none" }}>
                <div
                  className={`overflow-y-auto ${
                    showMap ? "hidden md:block" : "flex-1"
                  } md:w-[440px] md:flex-none`}
                >
                  <ResultsList
                    results={sortedResults}
                    onSelect={(id) => {
                      setSelectedProvider(id);
                      setView("detail");
                    }}
                  />
                </div>
                <div
                  className={`flex-1 ${
                    showMap ? "" : "hidden md:block"
                  }`}
                >
                  <MapView
                    results={sortedResults}
                    center={{ lat: searchParams.lat, lng: searchParams.lng }}
                    onSelect={(id) => {
                      setSelectedProvider(id);
                      setView("detail");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {view === "detail" && selectedProvider && (
          <ProviderDetail
            providerId={selectedProvider}
            onBack={() => setView("results")}
            onBook={(slotId) => {
              setSelectedSlotId(slotId);
              setView("booking");
            }}
          />
        )}

        {view === "booking" && selectedSlotId && selectedProvider && (
          <BookingFlow
            slotId={selectedSlotId}
            providerId={selectedProvider}
            onBack={() => setView("detail")}
            onSuccess={(result) => {
              setBookingResult(result);
              setView("confirmation");
            }}
            onSlotTaken={() => {
              setView("results");
              handleSearch(searchParams);
            }}
          />
        )}

        {view === "confirmation" && bookingResult && (
          <Confirmation
            booking={bookingResult}
            onFindAnother={() => {
              setView("search");
              setBookingResult(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
