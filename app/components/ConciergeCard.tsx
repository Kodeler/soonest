"use client";

import { useState } from "react";

interface Props {
  // Context from the search that was just run, to prefill the request
  categoryName?: string;
  keyword?: string;
}

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-violet-300 text-sm text-ink placeholder:text-stone-400 transition-colors";

export default function ConciergeCard({ categoryName, keyword }: Props) {
  const [open, setOpen] = useState(false);
  const [what, setWhat] = useState(keyword || categoryName || "");
  const [when, setWhen] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: "Concierge request",
          name,
          phone,
          kind: "concierge",
          category: categoryName,
          message: `Wants: ${what}\nBy when: ${when || "soonest available"}`,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="m-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p className="text-sm font-bold text-emerald-800">
          On it. We&apos;ll text you the soonest options shortly.
        </p>
        <p className="text-xs text-emerald-700 mt-1">
          A real person checks real calendars — usually within the hour during
          business hours.
        </p>
      </div>
    );
  }

  return (
    <div className="m-3 rounded-2xl border-2 border-dashed border-violet-200 bg-accent-light/40 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-violet-100 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-ink">
            Can&apos;t see a time that works? We&apos;ll find it.
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Tell us what you need and we&apos;ll text you the three soonest
            real openings nearby — a person checks, not a bot. Free.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-violet-200 text-primary hover:border-violet-300 transition-colors"
        >
          Find me the soonest
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              required
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder="What do you need? (e.g. men's haircut)"
              className={fieldClass}
            />
            <input
              type="text"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              placeholder="By when? (e.g. tonight 7pm)"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={fieldClass}
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile number (we text you options)"
              className={fieldClass}
            />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-gradient px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Text me the options"}
          </button>
        </form>
      )}
    </div>
  );
}
