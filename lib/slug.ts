export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * First free slug among `base`, `base-2`, `base-3`, ... (the pattern
 * scripts/sync-wedge-listings.ts uses). `isTaken` checks the DB.
 */
export async function uniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
  fallback: string = "shop"
): Promise<string> {
  const base = slugify(name) || fallback;
  let slug = base;
  for (let i = 2; await isTaken(slug); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}
