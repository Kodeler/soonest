import { BoltIcon } from "./icons";

// Listing-fidelity badge. These three states are a truthfulness promise:
// Sample = fictional demo data, Live = availability straight from the
// provider's calendar, Listed = directory info with booking off-site.
// Each must stay visually distinct — don't restyle them to look alike.

type Tier = "sample" | "live" | "listed";

const TITLES: Record<Tier, string> = {
  sample: "Sample listing shown while real providers onboard",
  live: "Availability comes straight from this provider's calendar — book in-app",
  listed: "Directory listing — booking completes on the provider's own site",
};

export default function TierBadge({ tier }: { tier: Tier }) {
  const shared =
    "inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-bold";

  if (tier === "live") {
    return (
      <span className={`${shared} bg-emerald-50 text-emerald-600`} title={TITLES.live}>
        <BoltIcon size={9} fill="currentColor" />
        Live
      </span>
    );
  }
  if (tier === "sample") {
    return (
      <span
        className={`${shared} bg-white border border-dashed border-stone-300 text-stone-400`}
        title={TITLES.sample}
      >
        Sample
      </span>
    );
  }
  return (
    <span className={`${shared} bg-stone-100 text-stone-500`} title={TITLES.listed}>
      Listed
    </span>
  );
}
