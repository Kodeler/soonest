"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";

const fieldClass =
  "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-violet-300 text-sm text-ink placeholder:text-stone-400 transition-colors";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
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
          business: business || "General inquiry",
          name,
          email,
          kind: "contact",
          message,
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

  return (
    <div className="min-h-screen bg-surface">
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

      <main className="max-w-xl mx-auto px-5 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Contact us
          </h1>
          <p className="text-stone-500 text-sm">
            Questions, corrections, or anything else — this goes straight to
            the team and we read everything.
          </p>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-accent-light/40 p-5 space-y-2">
          <h2 className="text-sm font-bold text-ink">Our listing policy</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Soonest lists factual, public business information — name, address,
            services and published prices — with a link to each business&apos;s
            own booking page, the same way a map or directory does. We never
            show live open times unless they come straight from a
            business&apos;s calendar through an authorized connection. If you
            own a listed business, we&apos;ll correct or remove your listing on
            request as soon as we confirm it&apos;s you — usually within a day.
            The fastest route is the &quot;Claim this listing&quot; button on
            your listing page, or this form.
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-800">
              Thanks — message received.
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              We&apos;ll get back to you at the email you provided.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
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
              type="text"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="Business name (if this is about a listing)"
              className={fieldClass}
            />
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message"
              rows={5}
              className={fieldClass}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send message"}
            </button>
          </form>
        )}

        <div className="flex items-center gap-5 text-xs text-stone-400">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Link href="/privacy" className="hover:text-primary">Privacy</Link>
          <Link href="/terms" className="hover:text-primary">Terms</Link>
        </div>
      </main>
    </div>
  );
}
