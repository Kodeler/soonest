// Booking notifications via Resend's REST API (plain fetch, no SDK).
// Every send is fire-and-forget from the caller's perspective: a mail
// failure must never fail a booking. Without RESEND_API_KEY the module
// no-ops and logs, so the feature lights up the moment the env var lands.

const RESEND_URL = "https://api.resend.com/emails";

const FROM =
  process.env.NOTIFY_FROM_EMAIL || "Soonest <bookings@send.soonest.today>";
// Ops copy of every booking (set to your own inbox in Vercel env vars).
const OPS = process.env.NOTIFY_OPS_EMAIL;

interface BookingEmailInput {
  providerName: string;
  providerNotifyEmail?: string | null;
  serviceName: string;
  startsAt: Date;
  durationMin: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingId: string;
}

function fmtTime(d: Date): string {
  return d.toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function send(
  to: string,
  subject: string,
  text: string
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("notify: RESEND_API_KEY not set; skipped email to", to);
    return false;
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, text }),
    });
    if (!res.ok) {
      console.error("notify: resend error", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("notify: send failed", e);
    return false;
  }
}

export async function sendBookingEmails(b: BookingEmailInput): Promise<void> {
  const when = fmtTime(b.startsAt);

  const jobs: Promise<boolean>[] = [];

  // Customer confirmation
  jobs.push(
    send(
      b.customerEmail,
      `Booked: ${b.serviceName} at ${b.providerName} — ${when}`,
      [
        `Hi ${b.customerName},`,
        ``,
        `You're booked.`,
        ``,
        `${b.serviceName} (${b.durationMin} min)`,
        `${b.providerName}`,
        `${when}`,
        ``,
        `Booking reference: ${b.bookingId}`,
        ``,
        `Need to change something? Reply to this email or contact the`,
        `business directly.`,
        ``,
        `— Soonest · soonest.today`,
      ].join("\n")
    )
  );

  // Provider notification
  if (b.providerNotifyEmail) {
    jobs.push(
      send(
        b.providerNotifyEmail,
        `New booking: ${b.serviceName} — ${when}`,
        [
          `New booking through Soonest:`,
          ``,
          `${b.serviceName} (${b.durationMin} min)`,
          `${when}`,
          ``,
          `Client: ${b.customerName}`,
          `Phone: ${b.customerPhone}`,
          `Email: ${b.customerEmail}`,
          ``,
          `Booking reference: ${b.bookingId}`,
          ``,
          `If this time doesn't work, contact the client directly as soon`,
          `as possible.`,
          ``,
          `— Soonest · soonest.today`,
        ].join("\n")
      )
    );
  }

  // Ops copy
  if (OPS) {
    jobs.push(
      send(
        OPS,
        `[ops] Booking at ${b.providerName}${
          b.providerNotifyEmail ? "" : " — NO PROVIDER EMAIL ON FILE"
        }`,
        [
          `${b.serviceName} (${b.durationMin} min) — ${when}`,
          `Provider: ${b.providerName} (notify: ${
            b.providerNotifyEmail ?? "none"
          })`,
          `Client: ${b.customerName} / ${b.customerPhone} / ${b.customerEmail}`,
          `Ref: ${b.bookingId}`,
        ].join("\n")
      )
    );
  }

  await Promise.allSettled(jobs);
}
