"use client";

import { useState } from "react";

interface Props {
  slotId: string;
  providerId: string;
  onBack: () => void;
  onSuccess: (result: {
    bookingId: string;
    providerName: string;
    slotTime: string;
    bookingUrl?: string;
  }) => void;
  onSlotTaken: () => void;
}

const fieldClass =
  "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-violet-300 text-sm text-ink placeholder:text-stone-400 transition-colors";

export default function BookingFlow({
  slotId,
  providerId,
  onBack,
  onSuccess,
  onSlotTaken,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotTaken, setSlotTaken] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, name, phone, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.slotTaken) {
          setSlotTaken(true);
          setError("This slot was just taken by someone else.");
          return;
        }
        throw new Error(data.error || "Booking failed");
      }

      onSuccess({
        bookingId: data.bookingId,
        providerName: "",
        slotTime: "",
        bookingUrl: data.bookingUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-md mx-auto px-4 py-8 space-y-7">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>

        <div className="space-y-1.5 animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Lock it in
          </h1>
          <p className="text-stone-500 text-sm">
            Your details — takes about 20 seconds
          </p>
        </div>

        {slotTaken ? (
          <div className="space-y-4 animate-fade-up">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-amber-800 text-sm font-bold">
                This slot was just taken
              </p>
              <p className="text-amber-600 text-xs mt-1.5 leading-relaxed">
                Someone beat you to it by seconds. Let&apos;s find the next best
                option — there are plenty.
              </p>
            </div>
            <button
              onClick={onSlotTaken}
              className="btn-gradient w-full py-3.5 text-white rounded-2xl font-bold"
            >
              ⚡ Find next available
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-ink">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-ink">Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(416) 555-0000"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-ink">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={fieldClass}
              />
            </div>

            {error && !slotTaken && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient w-full py-3.5 text-white rounded-2xl font-bold disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Booking...
                </span>
              ) : (
                "Confirm booking"
              )}
            </button>
            <p className="text-center text-xs text-stone-400">
              No account needed. Free to book.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
