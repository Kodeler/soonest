import type { ProviderResult } from "./types";

/**
 * Sample ("mock") listings exist to make the product demonstrable while a
 * category has no real coverage. Once a search is well covered by real
 * providers, samples are noise that erodes trust (they outrank real shops
 * under the Soonest sort because only they carry fake slots), so they are
 * dropped from the results.
 */
export const REAL_COVERAGE_THRESHOLD = 5;

export function hideSamplesWhenCovered(
  results: ProviderResult[],
  threshold: number = REAL_COVERAGE_THRESHOLD
): ProviderResult[] {
  const real = results.filter((r) => r.source !== "mock");
  return real.length >= threshold ? real : results;
}
