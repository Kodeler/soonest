import { NextRequest, NextResponse } from "next/server";

// Entry point for a provider connecting their Square account. Redirects to
// Square's OAuth consent page; the state value is double-submitted (URL +
// HttpOnly cookie) and verified in the callback to block CSRF/forged codes.
export async function GET(req: NextRequest) {
  const appId = process.env.SQUARE_APPLICATION_ID;
  const env = process.env.SQUARE_ENVIRONMENT || "sandbox";

  if (!appId) {
    return Response.json({ error: "Square not configured" }, { status: 503 });
  }

  const baseUrl =
    env === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  const redirectUri = `${req.nextUrl.origin}/api/connect/square/callback`;
  const state = crypto.randomUUID();

  const authUrl = new URL(`${baseUrl}/oauth2/authorize`);
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set(
    "scope",
    "APPOINTMENTS_READ APPOINTMENTS_WRITE ITEMS_READ MERCHANT_PROFILE_READ"
  );
  authUrl.searchParams.set("session", "false");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("square_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/api/connect/square",
  });
  return res;
}
