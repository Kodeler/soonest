"use client";

import { useState } from "react";
import Link from "next/link";

interface Lead {
  id: string;
  business: string;
  name: string;
  email: string;
  phone?: string | null;
  category?: string | null;
  plan: string;
  kind?: string;
  providerId?: string | null;
  message?: string | null;
  createdAt: string;
}

function kindBadge(l: Lead): { label: string; cls: string } {
  if (l.plan === "founding")
    return { label: "founding", cls: "btn-gradient text-white" };
  switch (l.kind) {
    case "claim":
      return { label: "claim", cls: "bg-amber-100 text-amber-700" };
    case "contact":
      return { label: "contact", cls: "bg-sky-100 text-sky-700" };
    case "concierge":
      return { label: "concierge", cls: "bg-violet-100 text-violet-700" };
    default:
      return { label: "lead", cls: "bg-stone-100 text-stone-500" };
  }
}

export default function AdminLeadsPage() {
  const [key, setKey] = useState("");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.status === 401) throw new Error("Wrong key");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-violet-100/80 px-5 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-ink">
          soonest
        </Link>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-stone-400">
          <span className="text-primary">Leads</span>
          <Link href="/admin/add-provider" className="hover:text-primary">Add provider</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        {!leads ? (
          <form onSubmit={load} className="max-w-sm mx-auto mt-16 space-y-4">
            <h1 className="text-xl font-bold text-ink text-center">
              Provider leads
            </h1>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin key"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm text-ink"
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || !key}
              className="btn-gradient w-full py-3 text-white rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Loading..." : "View leads"}
            </button>
          </form>
        ) : leads.length === 0 ? (
          <div className="text-center mt-16 space-y-2">
            <p className="text-ink font-bold text-lg">No leads yet</p>
            <p className="text-stone-400 text-sm">
              They&apos;ll appear here the moment a business signs up.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-ink">
              {leads.length} lead{leads.length === 1 ? "" : "s"}
            </h1>
            {leads.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-2xl border border-stone-200/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-ink">{l.business}</div>
                    <div className="text-sm text-stone-500 mt-0.5">
                      {l.name} ·{" "}
                      <a href={`mailto:${l.email}`} className="text-primary">
                        {l.email}
                      </a>
                      {l.phone && <> · {l.phone}</>}
                    </div>
                    {l.category && (
                      <div className="text-xs text-stone-400 mt-1">{l.category}</div>
                    )}
                    {l.message && (
                      <p className="text-xs text-stone-600 mt-2 bg-stone-50 rounded-lg p-2 whitespace-pre-wrap">
                        {l.message}
                      </p>
                    )}
                    {l.providerId && (
                      <div className="text-[11px] text-stone-400 mt-1.5">
                        listing: <span className="font-mono">{l.providerId}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${kindBadge(l).cls}`}
                    >
                      {kindBadge(l).label}
                    </span>
                    <div className="text-[11px] text-stone-400 mt-1.5">
                      {new Date(l.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
