import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { connectPage as page } from "@/lib/connect-pages";

// Acuity redirects here after the business approves (or denies) access.
// Verifies the double-submitted state, exchanges the code for a token, looks
// up the Acuity account, and stores the token keyed by account id so
// re-connecting refreshes instead of duplicating. Acuity tokens don't expire,
// so there is no refresh token to keep.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const denied = req.nextUrl.searchParams.get("error");

  if (denied) {
    return page(
      "Connection cancelled",
      "No problem — your Acuity account was not connected. You can close this window.",
      false
    );
  }

  const cookieState = req.cookies.get("acuity_oauth_state")?.value;
  if (!state || !cookieState || state !== cookieState) {
    return page(
      "Connection failed",
      "This link is stale or was opened in a different browser. Please start the connection again from soonest.today.",
      false
    );
  }

  if (!code) {
    return page(
      "Connection failed",
      "Acuity did not return an authorization code. Please try again.",
      false
    );
  }

  try {
    const tokenRes = await fetch("https://acuityscheduling.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${req.nextUrl.origin}/api/connect/acuity/callback`,
        client_id: process.env.ACUITY_CLIENT_ID ?? "",
        client_secret: process.env.ACUITY_CLIENT_SECRET ?? "",
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || !data.access_token) {
      console.error("Acuity token exchange failed:", data);
      return page(
        "Connection failed",
        "Acuity rejected the token exchange. Please try again, or contact us at soonest.today/contact.",
        false
      );
    }

    const meRes = await fetch("https://acuityscheduling.com/api/v1/me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const me = await meRes.json();

    if (!meRes.ok || me?.id == null) {
      console.error("Acuity account lookup failed:", me);
      return page(
        "Connection failed",
        "We couldn't read your Acuity account. Please try again, or contact us at soonest.today/contact.",
        false
      );
    }

    const accountId = String(me.id);
    await prisma.sellerToken.upsert({
      where: {
        source_externalSellerId: {
          source: "acuity",
          externalSellerId: accountId,
        },
      },
      create: {
        source: "acuity",
        externalSellerId: accountId,
        accessToken: data.access_token,
      },
      update: { accessToken: data.access_token },
    });

    return page(
      "Connected!",
      "Your Acuity account is now linked to Soonest. We'll be in touch as your live availability goes up — you can close this window.",
      true
    );
  } catch (e) {
    console.error("Acuity OAuth callback error:", e);
    return page(
      "Connection failed",
      "Something went wrong on our side. Please try again, or contact us at soonest.today/contact.",
      false
    );
  }
}
