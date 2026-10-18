/**
 * Time helpers for the claims/policy modules.
 *
 * #756 — date comparisons in claim processing previously used `new Date()`
 * directly. While a JS `Date` stores its value as a UTC epoch (so
 * comparisons against `policy.endTime` — which Prisma reads back as UTC —
 * are already timezone-correct at the instant level), the intent was not
 * explicit and the code read as if local time were involved. Centralising
 * UTC date construction here makes the contract obvious, gives every
 * comparison a single auditable place to inspect, and keeps timestamps
 * written to `processedAt`/`submittedAt` derived from the same UTC source
 * as the comparison operands.
 *
 * All comparisons in the claims module go through epoch milliseconds
 * (Date.prototype.getTime / Date.now), which are timezone-independent.
 * The helpers below exist for readability and auditability, not to
 * correct a runtime offset.
 */

/**
 * Returns a Date representing the current instant in UTC.
 *
 * Equivalent to `new Date()` but named to make the UTC intent explicit at
 * every call site. Prefer this in modules that compare against DB-stored
 * timestamps (which Prisma materialises as UTC) so reviewers don't have to
 * reason about server-local timezone behaviour.
 */
export function utcNow(): Date {
  return new Date();
}

/**
 * Returns the current UTC epoch milliseconds.
 *
 * Use this when only the numeric comparison is needed; it avoids
 * allocating a Date object on every call and makes the UTC basis
 * unambiguous.
 */
export function utcNowMs(): number {
  return Date.now();
}

/**
 * Returns a Date offset from a UTC instant by a number of milliseconds.
 *
 * Mirrors the `new Date(now.getTime() + ms)` pattern used by the worker
 * (e.g. the 1-hour lookahead window) while keeping the UTC origin
 * explicit.
 */
export function utcPlusMs(now: Date, ms: number): Date {
  return new Date(now.getTime() + ms);
}
