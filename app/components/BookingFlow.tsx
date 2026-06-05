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
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Confirm booking</h1>
          <p className="text-stone-500 text-sm">
            Enter your details to book this appointment
          </p>
        </div>

        {slotTaken ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm font-medium">
                This slot was just taken
              </p>
              <p className="text-amber-600 text-xs mt-1">
                Someone else booked it just before you. Let&apos;s find the next
                best option.
              </p>
            </div>
            <button
              onClick={onSlotTaken}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
            >
              Find next available
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(416) 555-0000"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
              />
            </div>

            {error && !slotTaken && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
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
          </form>
        )}
      </div>
    </div>
  );
}
