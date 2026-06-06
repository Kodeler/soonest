"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  vertical: string;
}

interface SearchParams {
  lat: number;
  lng: number;
  radiusKm: number;
  categorySlug: string;
  keyword: string;
  asap: boolean;
}

interface Props {
  categories: Category[];
  onSearch: (params: SearchParams) => void;
  loading: boolean;
  initialParams: SearchParams;
  compact?: boolean;
}

export default function SearchBar({
  categories,
  onSearch,
  loading,
  initialParams,
  compact,
}: Props) {
  const [params, setParams] = useState(initialParams);
  const [locationText, setLocationText] = useState("Toronto, ON");
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setParams((p) => ({
          ...p,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setLocationText("Current location");
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { timeout: 5000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(params);
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={params.keyword}
          onChange={(e) => setParams((p) => ({ ...p, keyword: e.target.value }))}
          placeholder="Search services..."
          className="flex-1 min-w-[140px] px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <select
          value={params.categorySlug}
          onChange={(e) => {
            const updated = { ...params, categorySlug: e.target.value };
            setParams(updated);
            onSearch(updated);
          }}
          className="px-3 py-2 text-sm rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const next = !params.asap;
            const updated = { ...params, asap: next };
            setParams(updated);
            onSearch(updated);
          }}
          className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            params.asap
              ? "bg-accent text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          ASAP
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "..." : "Search"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Location"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
          />
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"
            title="Use my location"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          value={params.keyword}
          onChange={(e) => setParams((p) => ({ ...p, keyword: e.target.value }))}
          placeholder="Search services, providers..."
          className="flex-1 px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
        <button
          type="button"
          onClick={() => setParams((p) => ({ ...p, categorySlug: "" }))}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            !params.categorySlug
              ? "bg-primary text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            type="button"
            key={c.slug}
            onClick={() => setParams((p) => ({ ...p, categorySlug: c.slug }))}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              params.categorySlug === c.slug
                ? "bg-primary text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setParams((p) => ({ ...p, asap: !p.asap }))}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            params.asap
              ? "bg-accent text-white shadow-lg shadow-accent/25"
              : "bg-accent-light text-accent border border-accent/20 hover:bg-accent/10"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Find me the soonest
        </button>

        <button
          type="submit"
          disabled={loading}
          onClick={(e) => { e.preventDefault(); onSearch(params); }}
          className="flex-1 py-3 bg-primary text-white rounded-xl text-base font-semibold hover:bg-primary-dark active:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching...
            </span>
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
}
