"use client";

import { useState } from "react";
import CategoryIcon from "./CategoryIcon";
import { BoltIcon } from "./icons";

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

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-violet-300 text-sm text-ink placeholder:text-stone-400 transition-colors";

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
          className="flex-1 min-w-[140px] px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-ink placeholder:text-stone-400"
        />
        <select
          value={params.categorySlug}
          onChange={(e) => {
            const updated = { ...params, categorySlug: e.target.value };
            setParams(updated);
            onSearch(updated);
          }}
          className="px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
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
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            params.asap
              ? "btn-gradient text-white"
              : "bg-white border border-stone-200 text-stone-500 hover:border-violet-200 hover:text-primary"
          }`}
        >
          <BoltIcon size={13} className={params.asap ? "" : "text-spark"} fill="currentColor" />
          ASAP
        </button>
        <button
          type="submit"
          onClick={(e) => { e.preventDefault(); onSearch(params); }}
          disabled={loading}
          className="btn-gradient px-4 py-2 text-white rounded-xl text-sm font-bold disabled:opacity-50"
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
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Location"
            className={`${inputClass} pl-10`}
          />
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-violet-50 text-stone-400 hover:text-primary transition-colors"
            title="Use my location"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </button>
        </div>
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            value={params.keyword}
            onChange={(e) => setParams((p) => ({ ...p, keyword: e.target.value }))}
            placeholder="Massage, haircut, dentist..."
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
        <button
          type="button"
          onClick={() => setParams((p) => ({ ...p, categorySlug: "" }))}
          className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
            !params.categorySlug
              ? "bg-ink text-white shadow-md shadow-ink/20"
              : "bg-stone-50 border border-stone-200 text-stone-500 hover:border-violet-200 hover:text-primary"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            type="button"
            key={c.slug}
            onClick={() => setParams((p) => ({ ...p, categorySlug: c.slug }))}
            className={`group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              params.categorySlug === c.slug
                ? "bg-ink text-white shadow-md shadow-ink/20"
                : "bg-stone-50 border border-stone-200 text-stone-500 hover:border-violet-200 hover:text-primary"
            }`}
          >
            <CategoryIcon
              icon={c.icon}
              slug={c.slug}
              className={
                params.categorySlug === c.slug
                  ? "text-white/80"
                  : "text-stone-400 group-hover:text-primary transition-colors"
              }
            />
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => setParams((p) => ({ ...p, asap: !p.asap }))}
          aria-pressed={params.asap}
          className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${
            params.asap
              ? "btn-gradient text-white"
              : "bg-accent-light text-primary border-2 border-dashed border-violet-200 hover:border-violet-300"
          }`}
        >
          <BoltIcon
            size={16}
            fill={params.asap ? "currentColor" : "none"}
            strokeWidth={2.5}
            className={params.asap ? "" : "text-spark"}
          />
          Find me the soonest
        </button>

        <button
          type="submit"
          disabled={loading}
          onClick={(e) => { e.preventDefault(); onSearch(params); }}
          className="btn-gradient flex-1 py-3.5 text-white rounded-2xl text-base font-bold disabled:opacity-50"
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
