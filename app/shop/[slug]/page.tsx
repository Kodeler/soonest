import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ClaimListing from "@/app/components/ClaimListing";

export const revalidate = 3600;

export async function generateStaticParams() {
  const providers = await prisma.provider.findMany({
    where: { source: { not: "mock" }, slug: { not: null } },
    select: { slug: true },
  });
  return providers.map((p) => ({ slug: p.slug as string }));
}

async function getProvider(slug: string) {
  const provider = await prisma.provider.findFirst({
    where: {
      source: { not: "mock" },
      OR: [{ slug }, { id: slug }],
    },
    include: { services: { include: { category: true } } },
  });
  return provider;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProvider(slug);
  if (!p) return {};
  const cheapest = [...p.services].sort(
    (a, b) => a.priceCents - b.priceCents
  )[0];
  return {
    title: `${p.name} — prices & booking | Soonest`,
    description: `${p.name} at ${p.address}. ${
      cheapest
        ? `${cheapest.name} from ${formatPrice(cheapest.priceCents)}. `
        : ""
    }Services, prices and booking on Soonest.`,
    alternates: { canonical: `/shop/${p.slug ?? p.id}` },
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProvider(slug);
  if (!p) notFound();

  const tier = p.source === "listed" ? "listed" : "live";
  const bookHref = p.bookingUrl ?? p.website ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    name: p.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: p.address.replace(/, Toronto.*$/i, ""),
      addressLocality: "Toronto",
      addressRegion: "ON",
      addressCountry: "CA",
    },
    geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(bookHref ? { url: bookHref } : {}),
    priceRange: "$".repeat(p.priceTier),
    ...(p.services.length > 0
      ? {
          makesOffer: p.services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.name },
            price: (s.priceCents / 100).toFixed(2),
            priceCurrency: "CAD",
          })),
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-violet-100/80 px-5 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Soonest" className="h-9 w-auto" />
        </Link>
        <Link
          href="/providers"
          className="text-sm font-semibold text-stone-500 hover:text-primary transition-colors"
        >
          For businesses
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="space-y-3">
          <nav className="text-xs text-stone-400">
            <Link href="/toronto/barbers" className="hover:text-primary">
              Barbershops in Toronto
            </Link>{" "}
            / <span className="text-stone-500">{p.name}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
            {p.name}
          </h1>
          <p className="text-stone-500 text-sm">{p.address}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-stone-500">
              {"$".repeat(p.priceTier)}
              <span className="text-stone-300">
                {"$".repeat(4 - p.priceTier)}
              </span>
            </span>
            {tier === "live" ? (
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold" title="Availability comes straight from this provider's calendar">
                ⚡ Live
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-stone-100 text-stone-500 font-bold" title="Directory listing — booking completes on the provider's own site">
                Listed
              </span>
            )}
            {p.phone && (
              <a
                href={`tel:${p.phone.replace(/[^+\d]/g, "")}`}
                className="text-sm text-stone-400 hover:text-primary"
              >
                {p.phone}
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {tier === "live" ? (
              <Link
                href={`/?p=${p.id}`}
                className="btn-gradient inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                See live times & book
              </Link>
            ) : (
              bookHref && (
                <a
                  href={bookHref}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn-gradient inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold"
                >
                  Book on their site
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              )
            )}
          </div>
        </div>

        {p.services.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Services & prices</h2>
            <div className="rounded-2xl bg-white border border-stone-200/80 divide-y divide-stone-100">
              {p.services.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <span className="text-sm font-semibold text-ink">
                    {s.name}
                  </span>
                  <span className="text-sm text-stone-500">
                    {formatPrice(s.priceCents)} · {s.durationMin}min
                  </span>
                </div>
              ))}
            </div>
            {tier === "listed" && (
              <p className="text-xs text-stone-400">
                Prices as published by the business; confirm when booking.
                Soonest shows live open times only when they come straight
                from a provider&apos;s calendar, so we never guess.
              </p>
            )}
          </section>
        )}

        {tier === "listed" && (
          <ClaimListing
            providerId={p.id}
            providerName={p.name}
            categorySlug={p.services[0]?.category.slug}
          />
        )}

        <div className="flex items-center gap-5 text-xs text-stone-400">
          <Link href="/" className="hover:text-primary">Search live availability</Link>
          <Link href="/toronto/barbers" className="hover:text-primary">All Toronto barbershops</Link>
          <Link href="/contact" className="hover:text-primary">Contact</Link>
        </div>
      </main>
    </div>
  );
}
