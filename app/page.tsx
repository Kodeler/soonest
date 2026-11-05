"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SearchBar from "@/app/components/SearchBar";
import Logo from "@/app/components/Logo";
import { DEFAULT_QUERY, toQueryString, type SearchQuery } from "@/lib/search-query";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  vertical: string;
}

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<{
    providers: number;
    liveProviders: number;
    openSlots: number;
  } | null>(null);

  useEffect(() => {
    // Legacy deep link: /?p=<providerId> predates the /p/[id] route and may
    // exist in the wild (shop permalinks shipped with it briefly).
    const pid = new URLSearchParams(window.location.search).get("p");
    if (pid) {
      router.replace(`/p/${pid}`);
      return;
    }
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, [router]);

  const handleSearch = (params: SearchQuery) => {
    startTransition(() => {
      router.push(`/search${toQueryString(params)}`);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-violet-100/80 px-5 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Soonest home">
          <Logo size={30} />
        </Link>
        <Link
          href="/providers"
          className="text-sm font-semibold text-stone-500 hover:text-primary transition-colors"
        >
          For businesses
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
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
                {stats && stats.liveProviders > 0
                  ? `${stats.liveProviders} Toronto ${
                      stats.liveProviders === 1 ? "business" : "businesses"
                    } with live availability`
                  : "Toronto's appointment search"}
              </div>
              <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl font-extrabold tracking-tight text-ink">
                Don&apos;t book soon.
                <br />
                <span className="text-gradient">Book soonest.</span>
              </h1>
              <p className="text-stone-500 text-lg sm:text-xl max-w-lg mx-auto">
                Time is money — spend it wisely. One search across massage,
                hair, fitness, dental and more, ranked by who can take you
                first.
              </p>
            </div>

            <div
              className="animate-fade-up rounded-3xl bg-white/90 backdrop-blur border border-violet-100 shadow-[0_24px_70px_-24px_rgba(109,40,217,0.35)] p-5 sm:p-7"
              style={{ animationDelay: "120ms" }}
            >
              <SearchBar
                categories={categories}
                onSearch={handleSearch}
                loading={isPending}
                initialParams={DEFAULT_QUERY}
              />
            </div>

            {stats && stats.providers >= 5 && (
              <div
                className="animate-fade-up flex items-center justify-center gap-6 sm:gap-10 text-center"
                style={{ animationDelay: "220ms" }}
              >
                {(
                  [
                    [`${stats.providers}`, "Toronto businesses"],
                    ...(stats.openSlots > 0
                      ? [[`${stats.openSlots.toLocaleString()}`, "open slots this week"] as [string, string]]
                      : []),
                    ["<1 min", "to book"],
                  ] as [string, string][]
                ).map(([stat, label]) => (
                  <div key={label}>
                    <div className="text-xl sm:text-2xl font-bold text-ink">{stat}</div>
                    <div className="text-xs sm:text-sm text-stone-400 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-5 text-xs text-stone-400">
              <Link href="/toronto/barbers" className="hover:text-primary">Toronto barbershops</Link>
              <Link href="/toronto/nails" className="hover:text-primary">Toronto nail salons</Link>
              <Link href="/toronto/massage" className="hover:text-primary">Toronto massage</Link>
              <Link href="/providers" className="hover:text-primary">List your business</Link>
              <Link href="/contact" className="hover:text-primary">Contact</Link>
              <Link href="/privacy" className="hover:text-primary">Privacy</Link>
              <Link href="/terms" className="hover:text-primary">Terms</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
