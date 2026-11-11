// Maps a connected platform's free-text service name onto our
// ServiceCategory taxonomy (slugs from prisma/seed.ts). Platforms like
// Square give no reliable category signal, so this is a keyword heuristic:
// pure, deterministic, and ordered so the more specific rule wins (e.g.
// "beard grooming" is a barber service, not pet grooming; "gel color" is
// nails, not hair colour).

export const DEFAULT_CATEGORY_SLUG = "haircut";

interface Rule {
  slug: string;
  patterns: RegExp[];
}

// Order matters: first matching rule wins.
const RULES: Rule[] = [
  {
    slug: "pet-grooming",
    patterns: [/\b(dog|dogs|puppy|cat|cats|pet|pets|canine|feline)\b/],
  },
  {
    slug: "nails",
    patterns: [
      /\bnails?\b/,
      /\bmani(cure)?s?\b/,
      /\bpedi(cure)?s?\b/,
      /\bmani[\s/&-]*pedi\b/,
      /\b(shellac|acrylics?|dip powder|sns|gel[\s-]?x)\b/,
      /\bgel (polish|colou?r|manicure|pedicure|removal|fill)\b/,
      /\bpolish change\b/,
    ],
  },
  {
    slug: "massage",
    patterns: [
      /\bmassages?\b/,
      /\brmt\b/,
      /\b(deep tissue|swedish|hot stone|reflexology|thai massage|shiatsu|lymphatic drainage|myofascial|cupping)\b/,
      /\bbodywork\b/,
    ],
  },
  {
    slug: "brows-lashes",
    patterns: [
      /\b(brows?|eyebrows?|lash|lashes|microblading|lamination|threading|lash lift|lash tint|brow tint)\b/,
    ],
  },
  {
    // Hair *removal* is a spa service; must precede the generic "hair" rule.
    slug: "spa",
    patterns: [/\b(laser|hair removal|electrolysis)\b/],
  },
  {
    slug: "haircut",
    patterns: [
      /\bhair ?cuts?\b/,
      /\bbarber(ing|s)?\b/,
      /\b(fade|fades|taper|buzz ?cut|line ?up|shape ?up|edge ?up)\b/,
      /\b(beard|shave|hot towel|straight razor)\b/,
      /\b(cut|cuts|trim)\b/,
      /\b(blow ?out|blow ?dry|balayage|highlights?|lowlights?|perm|keratin|hair colou?r|root touch ?up|toner|updo|braids?|locs?)\b/,
      /\bhair\b/,
    ],
  },
  {
    slug: "physiotherapy",
    patterns: [/\bphysio(therapy)?\b/, /\bphysical therapy\b/],
  },
  {
    slug: "chiropractor",
    patterns: [/\bchiro(practic|practor)?\b/, /\bspinal adjustment\b/],
  },
  {
    slug: "osteopath",
    patterns: [/\bosteo(path|pathy|pathic)?\b/],
  },
  {
    slug: "tattoo",
    patterns: [/\b(tattoos?|piercings?)\b/],
  },
  {
    slug: "spa",
    patterns: [
      /\b(facials?|peel|microdermabrasion|hydrafacial|dermaplaning|microneedling|waxing|wax|sugaring|spa|skin ?care)\b/,
    ],
  },
  {
    slug: "yoga",
    patterns: [/\b(yoga|pilates|reformer)\b/],
  },
  {
    slug: "fitness",
    patterns: [/\b(personal training|pt session|bootcamp|hiit|spin class|fitness)\b/],
  },
  {
    slug: "music-lessons",
    patterns: [/\b(piano|guitar|violin|drum|vocal|voice|singing) lessons?\b/, /\bmusic lessons?\b/],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/&\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Best-guess category slug for a service name, or null when no rule
 * matches. Callers decide the fallback (see categorizeServices).
 */
export function matchCategorySlug(serviceName: string): string | null {
  const text = normalize(serviceName);
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.slug;
  }
  return null;
}

/**
 * Categorizes every service of one business. A service no rule matches
 * (e.g. "Consultation", "Express") inherits the business's most common
 * matched category, since a business's catalog is overwhelmingly one kind
 * of thing; with no matches at all it falls back to `fallback`.
 */
export function categorizeServices(
  serviceNames: string[],
  fallback: string = DEFAULT_CATEGORY_SLUG
): string[] {
  const matched = serviceNames.map(matchCategorySlug);

  const counts = new Map<string, number>();
  for (const slug of matched) {
    if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  let dominant: string | null = null;
  let best = 0;
  for (const [slug, n] of counts) {
    if (n > best) {
      dominant = slug;
      best = n;
    }
  }

  return matched.map((slug) => slug ?? dominant ?? fallback);
}
