import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { connectPage as page } from "@/lib/connect-pages";

// Calendly redirects here after the user approves (or denies) access.
// Verifies the double-submitted state, exchanges the code for tokens, looks
// up the Calendly user, and stores the tokens keyed by user URI so
// re-connecting refreshes instead of duplicating.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const denied = req.nextUrl.searchParams.get("error");

  if (denied) {
    return page(
      "Connection cancelled",
      "No problem — your Calendly account was not connected. You can close this window.",
      false
    );
  }

  const cookieState = req.cookies.get("calendly_oauth_state")?.value;
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
      "Calendly did not return an authorization code. Please try again.",
      false
    );
  }

  try {
    const tokenRes = await fetch("https://auth.calendly.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.CALENDLY_CLIENT_ID ?? "",
        client_secret: process.env.CALENDLY_CLIENT_SECRET ?? "",
        code,
        redirect_uri: `${req.nextUrl.origin}/api/connect/calendly/callback`,
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || !data.access_token) {
      console.error("Calendly token exchange failed:", data);
      return page(
        "Connection failed",
        "Calendly rejected the token exchange. Please try again, or contact us at soonest.today/contact.",
        false
      );
    }

    const meRes = await fetch("https://api.calendly.com/users/me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const me = await meRes.json();
    const userUri: string | undefined = me?.resource?.uri;

    if (!meRes.ok || !userUri) {
      console.error("Calendly user lookup failed:", me);
      return page(
        "Connection failed",
        "We couldn't read your Calendly profile. Please try again, or contact us at soonest.today/contact.",
        false
      );
    }

    const tokenFields = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    };

    await prisma.sellerToken.upsert({
      where: {
        source_externalSellerId: {
          source: "calendly",
          externalSellerId: userUri,
        },
      },
      create: { source: "calendly", externalSellerId: userUri, ...tokenFields },
      update: tokenFields,
    });

    return page(
      "Connected!",
      "Your Calendly account is now linked to Soonest. We'll be in touch as your live availability goes up — you can close this window.",
      true
    );
  } catch (e) {
    console.error("Calendly OAuth callback error:", e);
    return page(
      "Connection failed",
      "Something went wrong on our side. Please try again, or contact us at soonest.today/contact.",
      false
    );
  }
}
