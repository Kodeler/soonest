import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CATEGORY_LANDINGS,
  TORONTO_AREAS,
  getArea,
  getLanding,
} from "@/lib/seo-areas";
import { getLandingProviders } from "@/lib/landing-data";
import LandingShopCard from "@/app/components/LandingShopCard";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_LANDINGS.flatMap((c) =>
    TORONTO_AREAS.map((a) => ({ category: c.slug, area: a.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; area: string }>;
}): Promise<Metadata> {
  const { category, area: areaSlug } = await params;
  const landing = getLanding(category);
  const area = getArea(areaSlug);
  if (!landing || !area) return {};
  return {
    title: `${landing.plural} in ${area.name}, Toronto — prices & booking | Soonest`,
    description: `${landing.plural} in ${area.name}: real published prices, services, and direct booking links. ${area.blurb}`,
    alternates: { canonical: `/toronto/${landing.slug}/${area.slug}` },
  };
}

export default async function AreaLandingPage({
  params,
}: {
  params: Promise<{ category: string; area: string }>;
}) {
  const { category, area: areaSlug } = await params;
  const landing = getLanding(category);
  const area = getArea(areaSlug);
  if (!landing || !area) notFound();

  const shops = await getLandingProviders(landing, area);
  const otherAreas = TORONTO_AREAS.filter((a) => a.slug !== area.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${landing.plural} in ${area.name}, Toronto`,
    numberOfItems: shops.length,
    itemListElement: shops.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": landing.schemaType,
        name: s.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: s.address.replace(/, Toronto.*$/i, ""),
          addressLocality: "Toronto",
          addressRegion: "ON",
          addressCountry: "CA",
        },
        ...(s.phone ? { telephone: s.phone } : {}),
        ...(s.bookingUrl || s.website
          ? { url: s.bookingUrl ?? s.website }
          : {}),
        priceRange: "$".repeat(s.priceTier),
      },
    })),
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

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="space-y-3">
          <nav className="text-xs text-stone-400">
            <Link href={`/toronto/${landing.slug}`} className="hover:text-primary">
              {landing.plural} in Toronto
            </Link>{" "}
            / <span className="text-stone-500">{area.name}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
            {landing.plural} in {area.name}
          </h1>
          <p className="text-stone-500 text-sm max-w-xl">
            {area.blurb}{" "}
            {shops.length > 0 && (
              <>
                {shops.length} {shops.length === 1 ? "shop" : "shops"} with
                published prices and direct booking links.
              </>
            )}{" "}
            Shops with the ⚡ Live badge share their calendar with Soonest, so
            you can{" "}
            <Link href="/" className="text-primary font-semibold">
              search by who can take you first
            </Link>
            .
          </p>
        </div>

        {shops.length === 0 ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 text-center space-y-2">
            <p className="font-semibold text-ink">
              No {landing.plural.toLowerCase()} listed here yet.
            </p>
            <p className="text-sm text-stone-400">
              We&apos;re adding {area.name} shops now — or{" "}
              <Link href={`/toronto/${landing.slug}`} className="text-primary font-semibold">
                browse all Toronto {landing.plural.toLowerCase()}
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shops.map((s) => (
              <LandingShopCard key={s.id} shop={s} />
            ))}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-ink">Nearby neighborhoods</h2>
          <div className="flex flex-wrap gap-2">
            {otherAreas.map((a) => (
              <Link
                key={a.slug}
                href={`/toronto/${landing.slug}/${a.slug}`}
                className="px-3.5 py-2 rounded-full text-xs font-semibold bg-white border border-stone-200 text-stone-500 hover:border-violet-200 hover:text-primary transition-colors"
              >
                {a.name}
              </Link>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-5 text-xs text-stone-400">
          <Link href="/" className="hover:text-primary">Search live availability</Link>
          <Link href="/providers" className="hover:text-primary">List your business</Link>
          <Link href="/contact" className="hover:text-primary">Contact</Link>
        </div>
      </main>
    </div>
  );
}
