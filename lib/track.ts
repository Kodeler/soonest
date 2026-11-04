/**
 * Client-side event tracking. Fire-and-forget; sendBeacon survives page
 * navigation (e.g. an outbound booking click).
 */
export function track(name: string, props?: Record<string, unknown>): void {
  try {
    const body = JSON.stringify({ name, props });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/events",
        new Blob([body], { type: "application/json" })
      );
      return;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics must never break the UI
  }
}
