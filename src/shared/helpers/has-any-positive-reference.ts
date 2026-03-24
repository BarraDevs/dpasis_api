/**
 * Returns true if any counter resolves to a value greater than zero.
 * Counters are evaluated in order; short-circuits on first positive count.
 */
type CountFn = ()=> Promise<number>;

export async function hasAnyPositiveReference(counters: ReadonlyArray<CountFn>): Promise<boolean> {
  for (const counter of counters) {
    if ((await counter()) > 0) {
      return true;
    }
  }
  return false;
}
