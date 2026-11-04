import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LANDINGS, TORONTO_AREAS, getLanding } from "@/lib/seo-areas";
import { getLandingProviders } from "@/lib/landing-data";
import LandingShopCard from "@/app/components/LandingShopCard";
import Logo from "@/app/components/Logo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_LANDINGS.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const landing = getLanding(category);
  if (!landing) return {};
  return {
    title: `${landing.plural} in Toronto — compare prices & book | Soonest`,
    description: `Every ${landing.singular} in Toronto's west end in one place: real prices, services, and booking links, neighborhood by neighborhood.`,
    alternates: { canonical: `/toronto/${landing.slug}` },
  };
}

export default async function CategoryHubPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const landing = getLanding(category);
  if (!landing) notFound();

  const shopsAll = await getLandingProviders(landing);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${landing.plural} in Toronto`,
    numberOfItems: shopsAll.length,
    itemListElement: shopsAll.map((s, i) => ({
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

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            {landing.plural} in Toronto
          </h1>
          <p className="text-stone-500 text-sm max-w-xl">
            {shopsAll.length} real {landing.plural.toLowerCase()} across
            Toronto&apos;s west end, with published prices and direct booking
            links. Shops with the ⚡ Live badge share their calendar with
            Soonest, so you can{" "}
            <Link href="/" className="text-primary font-semibold">
              search by who can take you first
            </Link>
            .
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">By neighborhood</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TORONTO_AREAS.map((a) => (
              <Link
                key={a.slug}
                href={`/toronto/${landing.slug}/${a.slug}`}
                className="rounded-xl bg-white border border-stone-200/80 px-4 py-3 hover:border-violet-300 transition-colors"
              >
                <span className="block text-sm font-bold text-ink">
                  {a.name}
                </span>
                <span className="block text-[11px] text-stone-400 mt-0.5">
                  {landing.plural}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">
            All {shopsAll.length} shops
          </h2>
          <div className="space-y-3">
            {shopsAll.map((s) => (
              <LandingShopCard key={s.id} shop={s} />
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
