"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

const STRIPE_FOUNDING_LINK = process.env.NEXT_PUBLIC_STRIPE_FOUNDING_LINK || "";

const fieldClass =
  "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-violet-300 text-sm text-ink placeholder:text-stone-400 transition-colors";

export default function ProvidersPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [plan, setPlan] = useState<"free" | "founding">("free");
  const [business, setBusiness] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business,
          name,
          email,
          phone: phone || undefined,
          category: category || undefined,
          plan,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setDone(true);
      if (plan === "founding" && STRIPE_FOUNDING_LINK) {
        window.location.href = STRIPE_FOUNDING_LINK;
      }
    } catch {
      setError("Something went wrong — try again or email hello@soonest.app");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-violet-100/80 px-5 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="Soonest" className="h-9 sm:h-10 w-auto" />
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold text-stone-500 hover:text-primary transition-colors"
        >
          Find an appointment →
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="hero-mesh relative px-4 pt-16 pb-14 overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-5 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-primary-dark shadow-sm">
              For business owners · Toronto launch
            </div>
            <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl font-extrabold tracking-tight text-ink">
              Your empty slots,
              <br />
              <span className="text-gradient">filled.</span>
            </h1>
            <p className="text-stone-500 text-lg sm:text-xl max-w-xl mx-auto">
              An open chair at 2pm is worth nothing at 3pm. Soonest sends you
              customers who want an appointment <em>right now</em> — exactly
              when your calendar has gaps.
            </p>
            <div className="pt-2">
              <a
                href="#signup"
                className="btn-gradient inline-flex px-8 py-3.5 text-white rounded-2xl text-base font-bold"
              >
                Get listed free
              </a>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-14">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold text-ink text-center mb-10">
              How it works
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                ["1", "List free in minutes", "Tell us about your business. Use Square? Connect it in 2 minutes and your live availability syncs automatically."],
                ["2", "We rank you by availability", "When someone nearby searches, whoever can take them first wins the top spot. Open calendar = free exposure."],
                ["3", "Bookings come to you", "Customers book your open slots directly. You get the details instantly. No commission during launch."],
              ].map(([n, title, body]) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-stone-200/80 p-6 card-hover"
                >
                  <div className="btn-gradient w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold mb-4">
                    {n}
                  </div>
                  <h3 className="font-bold text-ink mb-1.5">{title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-4 py-14 bg-white border-y border-stone-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-extrabold text-ink text-center mb-2">
              Launch pricing
            </h2>
            <p className="text-stone-500 text-center mb-10 text-sm">
              Early. Simple. Locked in for life for founding partners.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-stone-200 p-7 flex flex-col">
                <h3 className="font-bold text-ink text-lg">Free listing</h3>
                <div className="text-4xl font-extrabold text-ink mt-2">$0</div>
                <ul className="text-sm text-stone-500 space-y-2.5 mt-5 mb-7">
                  <li>✓ Full profile with services & reviews</li>
                  <li>✓ Ranked by your real availability</li>
                  <li>✓ Unlimited bookings, no commission</li>
                  <li>✓ Square calendar sync</li>
                </ul>
                <button
                  onClick={() => { setPlan("free"); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="mt-auto w-full py-3 rounded-2xl border border-stone-300 text-ink font-bold text-sm hover:border-violet-300 transition-colors"
                >
                  Start free
                </button>
              </div>
              <div className="relative rounded-3xl border-2 border-violet-300 p-7 flex flex-col bg-gradient-to-b from-accent-light/60 to-white">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 btn-gradient text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Founding Provider
                </div>
                <h3 className="font-bold text-ink text-lg">Featured</h3>
                <div className="text-4xl font-extrabold text-ink mt-2">
                  $39<span className="text-base font-semibold text-stone-400">/mo</span>
                </div>
                <ul className="text-sm text-stone-500 space-y-2.5 mt-5 mb-7">
                  <li>✓ Everything in Free</li>
                  <li>✓ Featured badge + top-of-category placement</li>
                  <li>✓ Founding partner price locked forever</li>
                  <li>✓ Direct line to the founders</li>
                  <li>✓ Cancel anytime</li>
                </ul>
                <button
                  onClick={() => { setPlan("founding"); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="btn-gradient mt-auto w-full py-3 rounded-2xl text-white font-bold text-sm"
                >
                  Become a founding provider
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Signup form */}
        <section id="signup" className="px-4 py-16">
          <div className="max-w-md mx-auto">
            {done ? (
              <div className="text-center space-y-4 animate-fade-up">
                <div className="animate-pop mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-ink">You&apos;re on the list</h2>
                <p className="text-stone-500 text-sm max-w-xs mx-auto">
                  We&apos;ll reach out within one business day to get your
                  listing live{plan === "founding" ? " and set up your featured placement" : ""}.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold text-ink">
                    {plan === "founding" ? "Become a Founding Provider" : "Get listed free"}
                  </h2>
                  <p className="text-stone-500 text-sm mt-1.5">
                    Takes 60 seconds. We handle the rest.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-3xl border border-violet-100 shadow-[0_24px_70px_-24px_rgba(109,40,217,0.25)] p-6">
                  <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl">
                    {(["free", "founding"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlan(p)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          plan === p ? "bg-white text-ink shadow-sm" : "text-stone-400"
                        }`}
                      >
                        {p === "free" ? "Free listing" : "Founding · $39/mo"}
                      </button>
                    ))}
                  </div>
                  <input type="text" required value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name" className={fieldClass} />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={fieldClass} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={fieldClass} />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={fieldClass} />
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                    <option value="">What kind of business?</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                    ))}
                    <option value="other">Something else</option>
                  </select>
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <button type="submit" disabled={submitting} className="btn-gradient w-full py-3.5 text-white rounded-2xl font-bold disabled:opacity-50">
                    {submitting ? "Sending..." : plan === "founding" ? "Claim founding spot" : "Get listed free"}
                  </button>
                  <p className="text-center text-xs text-stone-400">
                    No contracts. No commission during launch. Cancel anytime.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="px-5 py-6 border-t border-stone-100 text-center text-xs text-stone-400 space-x-5">
        <span>Soonest — Don&apos;t book soon. Book soonest.</span>
        <Link href="/privacy" className="hover:text-primary">Privacy</Link>
        <Link href="/terms" className="hover:text-primary">Terms</Link>
      </footer>
    </div>
  );
}
