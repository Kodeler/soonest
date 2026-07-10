"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface ServiceRow {
  name: string;
  durationMin: number;
  priceCents: number;
}

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_HOURS: DayHours[] = [
  { open: "10:00", close: "16:00", closed: true }, // Sun
  { open: "09:00", close: "17:00", closed: false },
  { open: "09:00", close: "17:00", closed: false },
  { open: "09:00", close: "17:00", closed: false },
  { open: "09:00", close: "17:00", closed: false },
  { open: "09:00", close: "17:00", closed: false },
  { open: "10:00", close: "16:00", closed: true }, // Sat
];

const fieldClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm text-ink placeholder:text-stone-400 transition-colors";

export default function AddProviderPage() {
  const [adminKey, setAdminKey] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoLabel, setGeoLabel] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [priceTier, setPriceTier] = useState(2);
  const [categorySlug, setCategorySlug] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([
    { name: "", durationMin: 30, priceCents: 5000 },
  ]);
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const geocode = async () => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !address) return;
    setGeocoding(true);
    setGeoLabel(null);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address + ", Toronto, ON"
        )}.json?access_token=${token}&proximity=-79.3832,43.6532&limit=1`
      );
      const data = await res.json();
      const feat = data.features?.[0];
      if (feat) {
        setLng(feat.center[0]);
        setLat(feat.center[1]);
        setGeoLabel(feat.place_name);
      } else {
        setGeoLabel("Not found — check the address");
      }
    } catch {
      setGeoLabel("Geocoding failed");
    } finally {
      setGeocoding(false);
    }
  };

  const updateService = (i: number, patch: Partial<ServiceRow>) => {
    setServices((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  const updateHours = (i: number, patch: Partial<DayHours>) => {
    setHours((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lat === null || lng === null) {
      setError("Geocode the address first (click Locate)");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          name,
          address,
          lat,
          lng,
          phone: phone || undefined,
          priceTier,
          categorySlug,
          services: services.filter((s) => s.name.trim()),
          hours,
        }),
      });
      const data = await res.json();
      if (res.status === 401) throw new Error("Wrong admin key");
      if (!res.ok) throw new Error(data.error || "Creation failed");
      setResult(`Live! ${name} created with ${data.slots} bookable slots.`);
      setName(""); setAddress(""); setLat(null); setLng(null); setGeoLabel(null);
      setPhone(""); setServices([{ name: "", durationMin: 30, priceCents: 5000 }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-violet-100/80 px-5 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold text-ink">
          soonest
        </Link>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-stone-400">
          <Link href="/admin/leads" className="hover:text-primary">Leads</Link>
          <span className="text-primary">Add provider</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-extrabold text-ink mb-1">Onboard a real provider</h1>
        <p className="text-sm text-stone-500 mb-6">
          Creates a live, bookable listing. Slots auto-generate from business
          hours and refresh daily.
        </p>

        {result && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-sm font-semibold">
            ✓ {result}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            required
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin key"
            className={fieldClass}
          />

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-3">
            <h2 className="font-bold text-ink text-sm">Business</h2>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name" className={fieldClass} />
            <div className="flex gap-2">
              <input type="text" required value={address} onChange={(e) => { setAddress(e.target.value); setLat(null); setLng(null); }} placeholder="Street address (e.g. 359 Bathurst St)" className={fieldClass} />
              <button type="button" onClick={geocode} disabled={geocoding || !address} className="px-4 py-2.5 rounded-xl bg-ink text-white text-sm font-bold whitespace-nowrap disabled:opacity-40">
                {geocoding ? "..." : "Locate"}
              </button>
            </div>
            {geoLabel && (
              <p className={`text-xs ${lat !== null ? "text-emerald-600" : "text-red-500"}`}>
                {lat !== null ? `📍 ${geoLabel}` : geoLabel}
              </p>
            )}
            <div className="flex gap-2">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={fieldClass} />
              <select value={priceTier} onChange={(e) => setPriceTier(Number(e.target.value))} className={fieldClass}>
                {[1, 2, 3, 4].map((t) => (
                  <option key={t} value={t}>{"$".repeat(t)}</option>
                ))}
              </select>
            </div>
            <select required value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className={fieldClass}>
              <option value="">Category...</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink text-sm">Services</h2>
              {services.length < 5 && (
                <button type="button" onClick={() => setServices((s) => [...s, { name: "", durationMin: 30, priceCents: 5000 }])} className="text-xs font-bold text-primary">
                  + Add service
                </button>
              )}
            </div>
            {services.map((svc, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={svc.name} onChange={(e) => updateService(i, { name: e.target.value })} placeholder="Service name" className={fieldClass} />
                <input type="number" value={svc.durationMin} onChange={(e) => updateService(i, { durationMin: Number(e.target.value) })} min={5} max={480} title="Minutes" className={`${fieldClass} !w-20`} />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                  <input type="number" value={svc.priceCents / 100} onChange={(e) => updateService(i, { priceCents: Math.round(Number(e.target.value) * 100) })} min={0} step={1} title="Price" className={`${fieldClass} !w-24 pl-6`} />
                </div>
                {services.length > 1 && (
                  <button type="button" onClick={() => setServices((s) => s.filter((_, j) => j !== i))} className="text-stone-300 hover:text-red-400 font-bold px-1">
                    ×
                  </button>
                )}
              </div>
            ))}
            <p className="text-[11px] text-stone-400">Name · minutes · price</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-2.5">
            <h2 className="font-bold text-ink text-sm">Weekly hours</h2>
            {hours.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-24 font-semibold text-ink">{DAY_NAMES[i]}</span>
                <label className="flex items-center gap-1.5 text-xs text-stone-500">
                  <input type="checkbox" checked={!h.closed} onChange={(e) => updateHours(i, { closed: !e.target.checked })} className="accent-violet-600" />
                  Open
                </label>
                {!h.closed && (
                  <>
                    <input type="time" value={h.open} onChange={(e) => updateHours(i, { open: e.target.value })} className="px-2 py-1.5 rounded-lg border border-stone-200 text-sm" />
                    <span className="text-stone-400">–</span>
                    <input type="time" value={h.close} onChange={(e) => updateHours(i, { close: e.target.value })} className="px-2 py-1.5 rounded-lg border border-stone-200 text-sm" />
                  </>
                )}
              </div>
            ))}
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button type="submit" disabled={submitting} className="btn-gradient w-full py-3.5 text-white rounded-2xl font-bold disabled:opacity-50">
            {submitting ? "Creating..." : "Create live listing"}
          </button>
        </form>
      </main>
    </div>
  );
}
