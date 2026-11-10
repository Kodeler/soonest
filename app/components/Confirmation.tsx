"use client";

interface Props {
  booking: {
    bookingId: string;
    providerName: string;
    slotTime: string;
    bookingUrl?: string;
  };
  onFindAnother: () => void;
}

function generateIcsUrl(providerName: string, slotTime: string): string {
  const start = slotTime
    ? new Date(slotTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    : "";
  const end = slotTime
    ? new Date(new Date(slotTime).getTime() + 60 * 60000)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0] + "Z"
    : "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Appointment at ${providerName}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export default function Confirmation({ booking, onFindAnother }: Props) {
  return (
    <div className="hero-mesh flex-1 flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full text-center space-y-7">
        <div className="animate-pop relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-emerald-200/50 blur-xl" aria-hidden />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        <div className="space-y-2 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            You&apos;re booked
          </h1>
          <p className="text-stone-500 text-sm">
            Your appointment is confirmed — that was fast.
          </p>
        </div>

        <div
          className="animate-fade-up bg-white/90 backdrop-blur rounded-2xl border border-violet-100 p-4 text-left space-y-1.5 shadow-sm"
          style={{ animationDelay: "220ms" }}
        >
          <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
            Booking ID
          </div>
          <div className="text-sm font-mono text-ink">{booking.bookingId}</div>
        </div>

        {booking.bookingUrl && (
          <a
            href={booking.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient block w-full py-3.5 text-white rounded-2xl font-bold"
          >
            Complete on provider site
          </a>
        )}

        <div
          className="animate-fade-up flex flex-col gap-2.5"
          style={{ animationDelay: "300ms" }}
        >
          {booking.slotTime && booking.providerName && (
            <a
              href={generateIcsUrl(booking.providerName, booking.slotTime)}
              download="appointment.ics"
              className="block w-full py-3.5 bg-white border border-stone-200 rounded-2xl text-sm font-semibold text-ink hover:border-violet-200 transition-colors"
            >
              Add to calendar
            </a>
          )}
          <button
            onClick={onFindAnother}
            className="btn-gradient w-full py-3.5 text-white rounded-2xl font-bold"
          >
            Find another appointment
          </button>
        </div>
      </div>
    </div>
  );
}
