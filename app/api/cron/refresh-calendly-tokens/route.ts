import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// Calendly access tokens expire after about two hours and each refresh token
// is single-use, so the new one returned must replace it. This runs hourly
// and rotates every stored Calendly token. A single failing token is logged
// and skipped — one revoked user must not break the rest.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.CALENDLY_CLIENT_ID;
  const clientSecret = process.env.CALENDLY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.json({ ok: true, refreshed: 0, note: "Calendly not configured" });
  }

  const tokens = await prisma.sellerToken.findMany({
    where: { source: "calendly", refreshToken: { not: null } },
  });

  let refreshed = 0;
  let failed = 0;

  for (const t of tokens) {
    try {
      const res = await fetch("https://auth.calendly.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: t.refreshToken!,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.access_token) {
        failed++;
        console.error(
          `Calendly refresh failed for user ${t.externalSellerId}:`,
          data
        );
        continue;
      }
      await prisma.sellerToken.update({
        where: { id: t.id },
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || t.refreshToken,
          expiresAt: data.expires_in
            ? new Date(Date.now() + data.expires_in * 1000)
            : null,
        },
      });
      refreshed++;
    } catch (e) {
      failed++;
      console.error(
        `Calendly refresh error for user ${t.externalSellerId}:`,
        e
      );
    }
  }

  return Response.json({ ok: true, refreshed, failed, total: tokens.length });
}
