import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return Response.json({ error: "No authorization code" }, { status: 400 });
  }

  const env = process.env.SQUARE_ENVIRONMENT || "sandbox";
  if (env === "production") {
    return Response.json(
      { error: "Production not allowed" },
      { status: 403 }
    );
  }

  const baseUrl =
    env === "sandbox"
      ? "https://connect.squareupsandbox.com"
      : "https://connect.squareup.com";

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
      return Response.json(
        { error: "Token exchange failed", details: data },
        { status: 400 }
      );
    }

    await prisma.sellerToken.create({
      data: {
        source: "square",
        externalSellerId: data.merchant_id || "unknown",
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      },
    });

    return new Response(
      `<html><body><h1>Connected!</h1><p>Your Square account is now connected. You can close this window.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    console.error("Square OAuth callback error:", e);
    return Response.json(
      { error: "OAuth callback failed" },
      { status: 500 }
    );
  }
}
