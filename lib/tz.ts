// Toronto-local time helpers. The app's providers are all in Toronto, but
// servers (Vercel) run in UTC, so naive setHours() produces slots at the
// wrong wall-clock time — e.g. "9 AM" slots at 4 AM Toronto.

const TZ = "America/Toronto";

export function torontoHour(d: Date): number {
  return parseInt(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      hour: "2-digit",
      hour12: false,
    }).format(d),
    10
  );
}

/**
 * The instant that is `hour:minute` Toronto wall-clock time on the Toronto
 * calendar day of `base` plus `daysAhead`. Works because Toronto's UTC
 * offset is a whole number of hours.
 */
export function atTorontoTime(
  base: Date,
  daysAhead: number,
  hour: number,
  minute: number
): Date {
  const d = new Date(base.getTime() + daysAhead * 86400000);
  d.setUTCMinutes(minute, 0, 0);
  const diff = hour - torontoHour(d);
  d.setTime(d.getTime() + diff * 3600000);
  return d;
}
