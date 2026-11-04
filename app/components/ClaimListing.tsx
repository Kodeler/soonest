"use client";

import { useState } from "react";

interface Props {
  providerId: string;
  providerName: string;
  categorySlug?: string;
}

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-violet-300 text-sm text-ink placeholder:text-stone-400 transition-colors";

export default function ClaimListing({
  providerId,
  providerName,
  categorySlug,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
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
          business: providerName,
          name,
          email,
          phone: phone || undefined,
          category: categorySlug,
          kind: "claim",
          providerId,
          message: message || undefined,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-800">
          Thanks — we&apos;ve got it.
        </p>
        <p className="text-xs text-emerald-700 mt-1">
          We&apos;ll reach out shortly to verify you and make any updates you
          asked for. If you requested removal, the listing comes down as soon
          as we confirm it&apos;s you.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-accent-light/40 p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-ink">Is this your business?</p>
        <p className="text-xs text-stone-500 mt-0.5">
          This listing was built from your public info. Claim it to correct
          details, remove it, or show live bookable times with the ⚡ Live
          badge — free while we&apos;re getting started.
        </p>
      </div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-violet-200 text-primary hover:border-violet-300 transition-colors"
        >
          Claim this listing
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
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
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={fieldClass}
            />
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className={fieldClass}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What should we update, or would you like it removed? (optional)"
            rows={2}
            className={fieldClass}
          />
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-gradient px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send claim"}
          </button>
        </form>
      )}
    </div>
  );
}
