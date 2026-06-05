import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const appId = process.env.SQUARE_APPLICATION_ID;
  const env = process.env.SQUARE_ENVIRONMENT || "sandbox";

  if (!appId) {
    return Response.json(
      { error: "Square not configured" },
      { status: 503 }
    );
  }

  if (env === "production") {
    return Response.json(
      { error: "Production Square OAuth is not allowed in this build" },
      { status: 403 }
    );
  }

  const baseUrl =
    env === "sandbox"
      ? "https://connect.squareupsandbox.com"
      : "https://connect.squareup.com";

  const redirectUri = `${req.nextUrl.origin}/api/connect/square/callback`;
  const state = crypto.randomUUID();

  const authUrl = new URL(`${baseUrl}/oauth2/authorize`);
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("scope", "APPOINTMENTS_READ APPOINTMENTS_WRITE ITEMS_READ MERCHANT_PROFILE_READ");
  authUrl.searchParams.set("session", "false");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);

  return Response.redirect(authUrl.toString());
}
