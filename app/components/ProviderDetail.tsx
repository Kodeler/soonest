"use client";

import { useEffect, useState } from "react";
import type { SlotResult } from "@/lib/types";

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
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);

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
        <div className="w-6 h-6 border-2 border-stone-300 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500">Provider not found</p>
        <button onClick={onBack} className="text-sm text-accent font-medium">
          Back to results
        </button>
      </div>
    );
  }

  const filteredSlots = selectedService
    ? slots.filter((s) => s.serviceId === selectedService)
    : slots;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{provider.name}</h1>
          <p className="text-stone-500 text-sm">{provider.address}</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm">
              <span className="text-amber-500">★</span>
              <span className="font-medium">{provider.ratingAvg.toFixed(1)}</span>
              <span className="text-stone-400">({provider.ratingCount} reviews)</span>
            </span>
            <span className="text-stone-400 text-sm">
              {"$".repeat(provider.priceTier)}
            </span>
            {provider.source !== "mock" && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">
                {provider.source}
              </span>
            )}
          </div>
          {provider.phone && (
            <p className="text-sm text-stone-400">{provider.phone}</p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Services</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
            {provider.services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedService(svc.id)}
                className={`px-3 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  selectedService === svc.id
                    ? "bg-primary text-white"
                    : "bg-white border border-stone-200 hover:border-stone-300 active:bg-stone-50"
                }`}
              >
                <span className="font-medium">{svc.name}</span>
                <span className="ml-2 opacity-70">
                  {svc.durationMin}min · {formatPrice(svc.priceCents)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Available times
            {filteredSlots.length > 0 && (
              <span className="text-stone-400 font-normal text-sm ml-2">
                {filteredSlots.length} slots
              </span>
            )}
          </h2>
          {filteredSlots.length === 0 ? (
            <p className="text-stone-400 text-sm">No available slots this week</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredSlots.slice(0, 18).map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => onBook(slot.id)}
                  className="px-3 py-3 rounded-xl bg-white border border-stone-200 hover:border-accent hover:bg-accent-light active:bg-accent-light text-sm font-medium transition-colors text-left"
                >
                  {formatSlotTime(slot.startsAt)}
                </button>
              ))}
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Reviews</h2>
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-xl p-4 border border-stone-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-500 text-sm">
                      {"★".repeat(Math.round(rev.rating))}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600">{rev.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
