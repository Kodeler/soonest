import { NextRequest } from "next/server";
import { syncSquareMerchants } from "@/lib/square-sync";

export const maxDuration = 60;

// Pulls every connected Square merchant's locations and appointment
// services into Provider/Service rows (see lib/square-sync.ts), so search
// reads the DB and only availability is fetched live. Runs every 4 hours;
// the OAuth callback also syncs a newly connected merchant immediately.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SQUARE_APPLICATION_ID) {
    return Response.json({ ok: true, merchants: 0, note: "Square not configured" });
  }

  try {
    const summary = await syncSquareMerchants();
    for (const r of summary.results) {
      if (!r.ok) console.error(`Square sync failed for merchant ${r.merchantId}: ${r.error}`);
    }
    const { ok: succeeded, ...rest } = summary;
    return Response.json({ ok: true, succeeded, ...rest });
  } catch (e) {
    console.error("Square merchant sync error:", e);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
