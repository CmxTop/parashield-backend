# Claims Module Timezone Handling (#756)

## Problem

Claim processing compared the current time against the policy's
`endTime` using `new Date()`. A JS `Date` stores its value as a UTC
epoch (so the comparison against Prisma's UTC-stored `endTime` is
already timezone-correct at the instant level), but the intent was not
explicit and the code read as if the server's local timezone were
involved. That made the boundary hard to audit and left room for
off-by-one-day errors to be introduced by future edits that construct
dates from local-time strings.

## Fix

All date construction in the claims module now goes through the UTC
helpers in `src/common/utils/time.utils.ts`:

- `utcNow()` — current instant, named to make the UTC basis explicit.
- `utcNowMs()` — current epoch milliseconds (for numeric comparisons).
- `utcPlusMs(now, ms)` — offset a UTC instant (used by the worker's
  1-hour lookahead window).

Comparisons are always performed on epoch milliseconds
(`Date.prototype.getTime()` / `Date.now()`), which are
timezone-independent. No claim-window comparison constructs a date
from a local-time string.

## Audit of date usage in the claims module

| Location | Operand | Source | Timezone basis |
|---|---|---|---|
| `claims.service.ts` — `autoProcess` expired check | `policy.endTime` | Prisma (UTC) | Compared against `utcNow()` as epoch ms |
| `claims.service.ts` — `autoProcess` pending-window check | `policy.endTime` | Prisma (UTC) | Compared against `utcNow()` as epoch ms |
| `claims.service.ts` — `submitClaim` expired check | `policy.endTime` | Prisma (UTC) | Compared against `utcNow()` as epoch ms |
| `claims.service.ts` — `recoverStuckProcessingPolicies` cutoff | `policy.updatedAt` | Prisma (UTC) | Derived from `utcNow()` default param as epoch ms |
| `claims.worker.ts` — lookahead window | `policy.endTime` | Prisma (UTC) | `utcNow()` + `utcPlusMs(now, 1h)` |
| `policy-state-cache.service.ts` — `getDerivedPolicyState` | `policy.startTime` / `endTime` | Prisma (UTC) | Epoch ms via `getTime()`; default `now` is current instant |
| `claims.service.ts` — `processedAt` writes | `new Date()` (now) | Server clock | Written as UTC instants (Prisma stores `DateTime` as UTC) |

No comparison in the claims module relies on the server's local
timezone. Timestamps written to `processedAt` / `submittedAt` are
UTC instants; Prisma materialises `DateTime` columns as UTC `Date`
objects and stores them as UTC.

## Tests

- `src/common/utils/time.utils.spec.ts` covers the helpers.
- `src/claims/claims.service.spec.ts` includes a `UTC date comparisons`
  block that pins the behaviour at a UTC midnight boundary and confirms
  the expired/pending outcomes are consistent regardless of how the
  instant is described, including a simulated non-UTC host timezone.
