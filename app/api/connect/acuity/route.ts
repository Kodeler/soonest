import { NextRequest, NextResponse } from "next/server";

// Entry point for a provider connecting their Acuity Scheduling (Squarespace
// Scheduling) account. Redirects to Acuity's OAuth consent page; the state
// value is double-submitted (URL + HttpOnly cookie) and verified in the
// callback to block CSRF/forged codes.
export async function GET(req: NextRequest) {
  const clientId = process.env.ACUITY_CLIENT_ID;

  if (!clientId) {
    return Response.json({ error: "Acuity not configured" }, { status: 503 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/connect/acuity/callback`;
  const state = crypto.randomUUID();

  const authUrl = new URL("https://acuityscheduling.com/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "api-v1");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("acuity_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/api/connect/acuity",
  });
  return res;
}
