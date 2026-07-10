"use client";

import { useEffect, useState } from "react";
import type { SlotResult } from "@/lib/types";
import Monogram from "./Monogram";

interface ProviderData {
  id: string;
  name: string;
  address: string;
  ratingAvg: number;
  ratingCount: number;
  priceTier: number;
  source: string;
  phone?: string;
  services: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
    categorySlug: string;
    categoryName: string;
  }[];
}

interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface Props {
  providerId: string;
  onBack: () => void;
  onBook: (slotId: string) => void;
}

function formatSlotTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((d.getTime() - now.getTime()) / 60000);

  if (diffMin < 60 && diffMin >= 0) return `in ${diffMin} min`;

  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + ` ${time}`;
}

function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

export default function ProviderDetail({ providerId, onBack, onBook }: Props) {
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [slots, setSlots] = useState<SlotResult[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/providers/${providerId}`)
      .then((r) => r.json())
      .then((d) => {
        setProvider(d.provider);
        setSlots(d.slots);
        setReviews(d.reviews);
        if (d.provider?.services?.length > 0) {
          setSelectedService(d.provider.services[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-violet-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500">Provider not found</p>
        <button onClick={onBack} className="text-sm text-primary font-semibold">
          Back to results
        </button>
      </div>
    );
  }

  const filteredSlots = selectedService
    ? slots.filter((s) => s.serviceId === selectedService)
    : slots;

  const soonest = filteredSlots[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-7">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to results
        </button>

        <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-accent-light via-white to-white p-6">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-200/30 blur-2xl" aria-hidden />
          <div className="relative space-y-2.5">
            <div className="flex items-center gap-4">
              <Monogram name={provider.name} size={56} />
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-ink">{provider.name}</h1>
                <p className="text-stone-500 text-sm mt-0.5">{provider.address}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {provider.ratingCount === 0 ? (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-violet-50 text-primary font-bold">
                  ✦ New on Soonest
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm">
                  <span className="text-amber-400">★</span>
                  <span className="font-bold text-ink">{provider.ratingAvg.toFixed(1)}</span>
                  <span className="text-stone-400">({provider.ratingCount} reviews)</span>
                </span>
              )}
              <span className="text-stone-500 text-sm font-medium">
                {"$".repeat(provider.priceTier)}
                <span className="text-stone-300">{"$".repeat(4 - provider.priceTier)}</span>
              </span>
              {provider.source === "mock" ? (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-stone-100 text-stone-400 font-bold" title="Sample listing shown while real providers onboard">
                  Sample
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">
                  {provider.source === "manual" ? "Verified" : provider.source}
                </span>
              )}
              {provider.phone && (
                <span className="text-sm text-stone-400">{provider.phone}</span>
              )}
            </div>
            {soonest && (
              <div className="pt-1.5">
                <button
                  onClick={() => onBook(soonest.id)}
                  className="btn-gradient inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Book soonest — {formatSlotTime(soonest.startsAt)}
                </button>
              </div>
            )}
            {provider.source === "mock" && (
              <p className="text-xs text-stone-400 pt-1">
                Sample listing — bookings here are demonstrations, not real
                appointments. Real providers are onboarding now.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <h2 className="text-lg font-bold text-ink">Services</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
            {provider.services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedService(svc.id)}
                className={`px-4 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedService === svc.id
                    ? "bg-ink text-white shadow-md shadow-ink/20"
                    : "bg-white border border-stone-200 hover:border-violet-200 active:bg-accent-light"
                }`}
              >
                <span className="font-semibold">{svc.name}</span>
                <span className="ml-2 opacity-60">
                  {svc.durationMin}min · {formatPrice(svc.priceCents)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "140ms" }}>
          <h2 className="text-lg font-bold text-ink">
            Available times
            {filteredSlots.length > 0 && (
              <span className="text-stone-400 font-normal text-sm ml-2">
                {filteredSlots.length} open
              </span>
            )}
          </h2>
          {filteredSlots.length === 0 ? (
            <p className="text-stone-400 text-sm">No available slots this week</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredSlots.slice(0, 18).map((slot, i) => (
                <button
                  key={slot.id}
                  onClick={() => onBook(slot.id)}
                  className={`group px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    i === 0
                      ? "bg-accent-light border-2 border-violet-300 text-primary-dark hover:border-primary"
                      : "bg-white border border-stone-200 text-ink hover:border-violet-300 hover:bg-accent-light"
                  }`}
                >
                  {i === 0 && (
                    <span className="block text-[10px] uppercase tracking-wider font-bold text-primary/70 mb-0.5">
                      ⚡ Next up
                    </span>
                  )}
                  {formatSlotTime(slot.startsAt)}
                </button>
              ))}
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <h2 className="text-lg font-bold text-ink">Reviews</h2>
            <div className="space-y-2.5">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200/70"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-amber-400 text-sm tracking-tight">
                      {"★".repeat(Math.round(rev.rating))}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{rev.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
