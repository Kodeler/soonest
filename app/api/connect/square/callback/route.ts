import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { connectPage as page } from "@/lib/connect-pages";

// Square redirects here after the seller approves (or denies) access.
// Verifies the double-submitted state, exchanges the code for tokens, and
// stores them keyed by merchant so re-connecting refreshes instead of
// duplicating.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const denied = req.nextUrl.searchParams.get("error");

  if (denied) {
    return page(
      "Connection cancelled",
      "No problem — your Square account was not connected. You can close this window.",
      false
    );
  }

  const cookieState = req.cookies.get("square_oauth_state")?.value;
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
      "Square did not return an authorization code. Please try again.",
      false
    );
  }

  const env = process.env.SQUARE_ENVIRONMENT || "sandbox";
  const baseUrl =
    env === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  try {
    const tokenRes = await fetch(`${baseUrl}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SQUARE_APPLICATION_ID,
        client_secret: process.env.SQUARE_APPLICATION_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${req.nextUrl.origin}/api/connect/square/callback`,
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || !data.access_token) {
      console.error("Square token exchange failed:", data);
      return page(
        "Connection failed",
        "Square rejected the token exchange. Please try again, or contact us at soonest.today/contact.",
        false
      );
    }

    const merchantId: string = data.merchant_id || "unknown";
    await prisma.sellerToken.upsert({
      where: {
        source_externalSellerId: {
          source: "square",
          externalSellerId: merchantId,
        },
      },
      create: {
        source: "square",
        externalSellerId: merchantId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      },
    });

    return page(
      "Connected!",
      "Your Square account is now linked to Soonest. We'll be in touch as your live availability goes up — you can close this window.",
      true
    );
  } catch (e) {
    console.error("Square OAuth callback error:", e);
    return page(
      "Connection failed",
      "Something went wrong on our side. Please try again, or contact us at soonest.today/contact.",
      false
    );
  }
}
