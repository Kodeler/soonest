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
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Booking confirmed</h1>
          <p className="text-stone-500 text-sm">
            Your appointment has been booked successfully
          </p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 text-left space-y-2">
          <div className="text-xs text-stone-400">Booking ID</div>
          <div className="text-sm font-mono text-stone-600">
            {booking.bookingId}
          </div>
        </div>

        {booking.bookingUrl && (
          <a
            href={booking.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
          >
            Complete on provider site
          </a>
        )}

        <div className="flex flex-col gap-2">
          {booking.slotTime && booking.providerName && (
            <a
              href={generateIcsUrl(booking.providerName, booking.slotTime)}
              download="appointment.ics"
              className="block w-full py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Add to calendar
            </a>
          )}
          <button
            onClick={onFindAnother}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Find another appointment
          </button>
        </div>
      </div>
    </div>
  );
}
