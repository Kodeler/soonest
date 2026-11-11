import { NextRequest, NextResponse } from "next/server";

// Entry point for a provider connecting their Calendly account. Redirects to
// Calendly's OAuth consent page; the state value is double-submitted (URL +
// HttpOnly cookie) and verified in the callback to block CSRF/forged codes.
export async function GET(req: NextRequest) {
  const clientId = process.env.CALENDLY_CLIENT_ID;

  if (!clientId) {
    return Response.json({ error: "Calendly not configured" }, { status: 503 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/connect/calendly/callback`;
  const state = crypto.randomUUID();

  const authUrl = new URL("https://auth.calendly.com/oauth/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("calendly_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/api/connect/calendly",
  });
  return res;
}
