"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { RankedResult } from "@/lib/types";
import SearchBar from "@/app/components/SearchBar";
import ResultsList from "@/app/components/ResultsList";
import ConciergeCard from "@/app/components/ConciergeCard";
import MapView from "@/app/components/MapView";
import Logo from "@/app/components/Logo";
import { BoltIcon, ListIcon, MapIcon, SearchIcon } from "@/app/components/icons";
import { fromSearchParams, toQueryString, type SearchQuery } from "@/lib/search-query";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  vertical: string;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white border border-stone-200/80 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="w-[42px] h-[42px] rounded-xl bg-stone-100 flex-shrink-0" />
        <div className="flex-1 space-y-2.5 py-0.5">
          <div className="flex items-center justify-between gap-2">
            <div className="h-3.5 bg-stone-100 rounded w-1/2" />
            <div className="h-5 bg-stone-100 rounded-full w-20" />
          </div>
          <div className="h-2.5 bg-stone-100 rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-2.5 bg-stone-100 rounded w-12" />
            <div className="h-2.5 bg-stone-100 rounded w-10" />
            <div className="h-2.5 bg-stone-100 rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = useMemo(
    () => fromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const queryKey = toQueryString(query);

  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Results correspond to loadedKey; while it trails queryKey we're loading.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== queryKey;
  const [sortBy, setSortBy] = useState<"score" | "time" | "distance" | "rating">("score");
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: query.lat,
        lng: query.lng,
        radiusKm: query.radiusKm,
        categorySlug: query.categorySlug || undefined,
        keyword: query.keyword || undefined,
        asap: query.asap,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        if (!cancelled) {
          setResults(data.results);
          setError(null);
          setLoadedKey(queryKey);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Search failed");
          setLoadedKey(queryKey);
        }
      });

    return () => {
      cancelled = true;
    };
    // queryKey is the canonical serialization of query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const handleSearch = (params: SearchQuery) => {
    const next = toQueryString(params);
    if (next === queryKey) return;
    router.push(`/search${next}`);
  };

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "time":
        if (!a.soonestSlot) return 1;
        if (!b.soonestSlot) return -1;
        return (
          new Date(a.soonestSlot.startsAt).getTime() -
          new Date(b.soonestSlot.startsAt).getTime()
        );
      case "distance":
        return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      case "rating":
        return b.ratingAvg - a.ratingAvg;
      default:
        return b.score - a.score;
    }
  });

  return (
    <div className="h-dvh flex flex-col bg-surface">
      <header className="glass z-20 border-b border-violet-100/80 px-5 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Soonest home">
          <Logo size={30} />
        </Link>
        <div className="flex items-center gap-2 text-sm" aria-live="polite">
          {loading ? (
            <span className="text-stone-400 font-medium">Searching…</span>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-stone-500 font-medium">
                {results.length} {results.length === 1 ? "place" : "places"} found
              </span>
            </>
          )}
        </div>
      </header>

      <div className="glass z-10 border-b border-violet-100/60 px-4 py-3">
        <SearchBar
          key={queryKey}
          categories={categories}
          onSearch={handleSearch}
          loading={loading}
          initialParams={query}
          compact
        />
        <div className="flex items-center gap-2 pt-2.5 -mb-0.5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 flex-shrink-0">
            {(["score", "time", "distance", "rating"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  sortBy === s
                    ? "btn-gradient text-white"
                    : "bg-white border border-stone-200 text-stone-500 hover:border-violet-200 hover:text-primary"
                }`}
              >
                {s === "time" && (
                  <BoltIcon
                    size={11}
                    fill="currentColor"
                    className={sortBy === s ? "" : "text-spark"}
                  />
                )}
                {s === "score" ? "Best match" : s === "time" ? "Soonest" : s === "distance" ? "Nearest" : "Top rated"}
              </button>
            ))}
          </div>
          <div className="ml-auto flex-shrink-0 md:hidden">
            <button
              onClick={() => setShowMap(!showMap)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-ink text-white whitespace-nowrap"
            >
              {showMap ? <ListIcon size={12} /> : <MapIcon size={12} />}
              {showMap ? "List" : "Map"}
            </button>
          </div>
        </div>
      </div>

      {error && !loading ? (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div className="space-y-3">
            <p className="text-ink text-lg font-semibold">Something went wrong</p>
            <p className="text-red-600 text-sm max-w-xs mx-auto">{error}</p>
          </div>
        </div>
      ) : !loading && results.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="space-y-3 animate-fade-up text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
              <SearchIcon size={28} strokeWidth={1.8} />
            </div>
            <p className="text-ink text-lg font-semibold">No results found</p>
            <p className="text-stone-400 text-sm max-w-xs mx-auto">
              Try expanding your search radius or picking a different category
            </p>
          </div>
          <div className="w-full max-w-md mt-6">
            <ConciergeCard
              categoryName={
                categories.find((c) => c.slug === query.categorySlug)?.name
              }
              keyword={query.keyword || undefined}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div
            className={`overflow-y-auto ${
              showMap ? "hidden md:block" : "flex-1"
            } md:w-[440px] md:flex-none`}
          >
            {loading ? (
              <div className="p-3 space-y-2.5" aria-hidden>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <>
                <ResultsList
                  results={sortedResults}
                  onSelect={(id) => router.push(`/p/${id}`)}
                />
                <ConciergeCard
                  categoryName={
                    categories.find((c) => c.slug === query.categorySlug)?.name
                  }
                  keyword={query.keyword || undefined}
                />
              </>
            )}
          </div>
          <div className={`flex-1 ${showMap ? "" : "hidden md:block"}`}>
            <MapView
              results={sortedResults}
              center={{ lat: query.lat, lng: query.lng }}
              onSelect={(id) => router.push(`/p/${id}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
