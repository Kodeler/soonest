import { prisma } from "./db";

/**
 * First-party event log. Fire-and-forget: analytics must never slow down
 * or break the request that triggered it.
 */
export function logEvent(
  name: string,
  props?: Record<string, unknown>
): void {
  void prisma.event
    .create({
      data: {
        name,
        propsJson: props ? JSON.stringify(props) : null,
      },
    })
    .catch(() => {});
}
