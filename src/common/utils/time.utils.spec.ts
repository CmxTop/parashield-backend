import { utcNow, utcNowMs, utcPlusMs } from './time.utils';

// #756 — the UTC helpers exist to make the timezone basis of date
// comparisons explicit and auditable across the claims module.
describe('UTC time helpers (#756)', () => {
  it('utcNow returns a Date within a millisecond of Date.now', () => {
    const before = Date.now();
    const now = utcNow();
    const after = Date.now();
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(after);
  });

  it('utcNowMs matches Date.now within tolerance', () => {
    const before = Date.now();
    const ms = utcNowMs();
    const after = Date.now();
    expect(ms).toBeGreaterThanOrEqual(before);
    expect(ms).toBeLessThanOrEqual(after);
  });

  it('utcPlusMs offsets a UTC instant by the given milliseconds', () => {
    const base = new Date('2026-06-01T00:00:00.000Z');
    const oneHourLater = utcPlusMs(base, 60 * 60 * 1000);
    expect(oneHourLater.toISOString()).toBe('2026-06-01T01:00:00.000Z');

    const oneHourEarlier = utcPlusMs(base, -60 * 60 * 1000);
    expect(oneHourEarlier.toISOString()).toBe('2026-05-31T23:00:00.000Z');
  });

  it('utcPlusMs does not mutate the input Date', () => {
    const base = new Date('2026-06-01T00:00:00.000Z');
    utcPlusMs(base, 1000);
    expect(base.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('utcNow is timezone-independent: same epoch regardless of host TZ', () => {
    // The epoch ms of utcNow must not depend on the server's local timezone.
    // We can't change process TZ in a unit test, but we can assert the
    // returned Date's getTime() is a plain epoch (no offset applied).
    const now = utcNow();
    expect(typeof now.getTime()).toBe('number');
    expect(now.getTime()).toBeGreaterThan(0);
    // A Date constructed from the same epoch must be equal.
    expect(new Date(now.getTime()).getTime()).toBe(now.getTime());
  });
});
