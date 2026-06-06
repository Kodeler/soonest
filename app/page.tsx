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
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-stone-200/60 px-5 py-2.5 flex items-center justify-between">
        <button
          onClick={() => { setView("search"); setSelectedProvider(null); }}
          className="flex items-center"
        >
          <img src="/logo.png" alt="Soonest" className="h-9 sm:h-10 w-auto" />
        </button>
        {view === "results" && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-400 font-medium">{results.length} results</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {view === "search" && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-primary-light/40 to-white">
            <div className="w-full max-w-xl space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary-dark to-accent bg-clip-text text-transparent">
                  Find an appointment, fast
                </h1>
                <p className="text-stone-500 text-lg max-w-md mx-auto">
                  Search every bookable service near you — ranked by soonest available
                </p>
              </div>
              <SearchBar
                categories={categories}
                onSearch={handleSearch}
                loading={loading}
                initialParams={searchParams}
              />
              {error && (
                <div className="text-center text-red-600 text-sm">{error}</div>
              )}
            </div>
          </div>
        )}

        {view === "results" && (
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-stone-200 px-4 py-3">
              <SearchBar
                categories={categories}
                onSearch={handleSearch}
                loading={loading}
                initialParams={searchParams}
                compact
              />
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-stone-100 overflow-x-auto">
              <div className="flex gap-1 flex-shrink-0">
                {(["score", "time", "distance", "rating"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      sortBy === s
                        ? "bg-primary text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {s === "score" ? "Best match" : s === "time" ? "Soonest" : s === "distance" ? "Nearest" : "Top rated"}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex-shrink-0 md:hidden">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 whitespace-nowrap"
                >
                  {showMap ? "List" : "Map"}
                </button>
              </div>
            </div>

            {results.length === 0 && !loading ? (
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <div className="space-y-2">
                  <p className="text-stone-500 text-lg">No results found</p>
                  <p className="text-stone-400 text-sm">
                    Try expanding your search radius or changing the category
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
                <div
                  className={`overflow-y-auto ${
                    showMap ? "hidden md:block" : "flex-1"
                  } md:w-[420px] md:flex-none`}
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
