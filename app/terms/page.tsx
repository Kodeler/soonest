import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Soonest",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-violet-100/80 px-5 py-3">
        <Link href="/" className="text-lg font-extrabold text-ink">
          soonest
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">Terms of Service</h1>
          <p className="text-sm text-stone-400 mt-2">Last updated: July 10, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">What Soonest is</h2>
          <p>
            Soonest is a discovery and booking service that helps you find
            local service providers ranked by how soon they can take you.
            Appointments are delivered by independent businesses, not by
            Soonest. The contract for any service is between you and the
            provider.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">Early access & sample listings</h2>
          <p>
            Soonest is in early access. Some listings are clearly-marked
            sample data used to demonstrate the service while real providers
            onboard. Bookings made with sample listings are demonstrations
            only and do not create real appointments. Live, API-connected
            providers are labeled with their booking source.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">Bookings & cancellations</h2>
          <p>
            When you book, we pass your details to the provider. Cancellation,
            no-show, and refund policies belong to the provider — contact them
            directly for changes. Provider ratings and pricing shown on
            Soonest are informational and can change.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">Business listings</h2>
          <p>
            Free listings may be edited or removed at our discretion. Paid
            placements (such as Founding Provider) are billed monthly, can be
            cancelled anytime, and end at the close of the billing period.
            Featured placement is always labeled — it never silently alters
            availability-based ranking.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">Liability</h2>
          <p>
            Soonest is provided as-is. To the maximum extent permitted by law,
            we are not liable for the acts, omissions, or service quality of
            providers, or for losses arising from missed, changed, or
            unsatisfactory appointments.
          </p>
        </section>

        <section className="space-y-3 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-lg font-bold text-ink">Contact</h2>
          <p>
            Questions:{" "}
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
