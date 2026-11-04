import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Soonest",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-violet-100/80 px-5 py-3">
        <Link href="/" className="text-lg font-bold text-ink">
          soonest
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-ink">Privacy Policy</h1>
          <p className="text-sm text-stone-400 mt-2">Last updated: July 10, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">What we collect</h2>
          <p>
            When you book an appointment, we collect your name, phone number,
            and email address so the provider can confirm and deliver your
            appointment. When a business requests a listing, we collect the
            business name, contact name, email, and phone number.
          </p>
          <p>
            If you use the &quot;use my location&quot; feature, your
            coordinates are used to rank nearby providers and are not stored.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">How we use it</h2>
          <p>
            Booking details are shared with the provider you book with — that
            is the point of the service. Business contact details are used to
            set up and manage listings. We do not sell personal information to
            anyone.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">Third-party services</h2>
          <p>
            We use Vercel (hosting), Turso (database), Mapbox (maps), and
            payment/booking platform partners such as Square and Stripe. Each
            processes data only as needed to run the service.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">Retention & deletion</h2>
          <p>
            We keep booking records while your appointment is relevant and to
            operate the service. To have your data corrected or deleted, email
            us and we will action it within 30 days.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">Contact</h2>
          <p>
            Questions or requests:{" "}
            <a href="mailto:sean@norvesta.ca" className="text-primary font-semibold">
              sean@norvesta.ca
            </a>
          </p>
        </section>

        <div className="pt-6 border-t border-stone-100">
          <Link href="/" className="text-sm font-semibold text-primary">
            ← Back to Soonest
          </Link>
        </div>
      </main>
    </div>
  );
}
