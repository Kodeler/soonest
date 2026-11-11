import { prisma } from "@/lib/db";

// Square seller OAuth tokens live in SellerToken, unique per
// (source "square", externalSellerId = merchant_id). Every Square read is
// made with the owning merchant's own token — never a shared env token.

export interface SellerAccess {
  merchantId: string;
  accessToken: string;
}

function usable(
  t: { accessToken: string; expiresAt: Date | null },
  now: Date
): boolean {
  if (!t.accessToken) return false;
  // An expired token would only produce a 401; treat it as absent so the
  // provider simply shows no availability (refresh-square-tokens rotates
  // them daily, so this is the revoked/abandoned case).
  return !t.expiresAt || t.expiresAt.getTime() > now.getTime();
}

/** The merchant's current access token, or null if missing/expired. */
export async function getSquareAccessToken(
  merchantId: string | null | undefined,
  now: Date = new Date()
): Promise<string | null> {
  if (!merchantId) return null;
  const t = await prisma.sellerToken.findUnique({
    where: {
      source_externalSellerId: { source: "square", externalSellerId: merchantId },
    },
    select: { accessToken: true, expiresAt: true },
  });
  return t && usable(t, now) ? t.accessToken : null;
}

/** Batch lookup: merchantId → access token, for usable tokens only. */
export async function getSquareAccessTokens(
  merchantIds: string[],
  now: Date = new Date()
): Promise<Map<string, string>> {
  const ids = [...new Set(merchantIds.filter(Boolean))];
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  const rows = await prisma.sellerToken.findMany({
    where: { source: "square", externalSellerId: { in: ids } },
    select: { externalSellerId: true, accessToken: true, expiresAt: true },
  });
  for (const r of rows) {
    if (usable(r, now)) out.set(r.externalSellerId, r.accessToken);
  }
  return out;
}

/** All connected Square merchants with a usable token. */
export async function listSquareSellers(
  now: Date = new Date(),
  merchantId?: string
): Promise<SellerAccess[]> {
  const rows = await prisma.sellerToken.findMany({
    where: {
      source: "square",
      ...(merchantId ? { externalSellerId: merchantId } : {}),
    },
    select: { externalSellerId: true, accessToken: true, expiresAt: true },
  });
  return rows
    .filter((r) => r.externalSellerId !== "unknown" && usable(r, now))
    .map((r) => ({ merchantId: r.externalSellerId, accessToken: r.accessToken }));
}
