import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { syncSquareMerchants } from "@/lib/square-sync";

export const maxDuration = 120;

// Square OAuth access tokens expire every 30 days; Square recommends
// refreshing them at least weekly. This runs daily and rotates every stored
// seller token that has a refresh token, so a connected merchant never
// silently goes dark. A single failing token is logged and skipped — one
// revoked merchant must not break the rest.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appId = process.env.SQUARE_APPLICATION_ID;
  const appSecret = process.env.SQUARE_APPLICATION_SECRET;
  if (!appId || !appSecret) {
    return Response.json({ ok: true, refreshed: 0, note: "Square not configured" });
  }

  const baseUrl =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  const tokens = await prisma.sellerToken.findMany({
    where: { source: "square", refreshToken: { not: null } },
  });

  let refreshed = 0;
  let failed = 0;

  for (const t of tokens) {
    try {
      const res = await fetch(`${baseUrl}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: appId,
          client_secret: appSecret,
          grant_type: "refresh_token",
          refresh_token: t.refreshToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) {
        failed++;
        console.error(
          `Square refresh failed for merchant ${t.externalSellerId}:`,
          data
        );
        continue;
      }
      await prisma.sellerToken.update({
        where: { id: t.id },
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || t.refreshToken,
          expiresAt: data.expires_at ? new Date(data.expires_at) : null,
        },
      });
      refreshed++;
    } catch (e) {
      failed++;
      console.error(
        `Square refresh error for merchant ${t.externalSellerId}:`,
        e
      );
    }
  }

  // Sync merchant catalogs right after the refresh, so the daily job uses
  // the freshest tokens and we stay inside Vercel Hobby's two-cron limit.
  let sync: unknown = null;
  try {
    sync = await syncSquareMerchants();
  } catch (e) {
    console.error("Square merchant sync error:", e);
  }

  return Response.json({ ok: true, refreshed, failed, total: tokens.length, sync });
}
