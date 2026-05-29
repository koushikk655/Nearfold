// Formatting helpers. The backend stores all money as integer paise, so
// every rupee value the user sees passes through `formatPaise`.

/**
 * Paise → "₹240" or "₹240.50". Trims the decimal when it's a whole rupee
 * value (the common case for Indian street commerce).
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

/** Bare number form for JetBrains-Mono price displays where the ₹ is drawn separately. */
export function paiseToRupeesString(paise: number): string {
  const rupees = paise / 100;
  return rupees.toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Backend returns straight-line `distanceMeters`. Render as "320 m" under a
 * kilometre, "1.2 km" above. Tier-2 hyperlocal: most results are <2 km.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** "4.8" — one decimal, or "New" when a seller has no rating yet. */
export function formatRating(rating: number): string {
  if (!rating || rating <= 0) return 'New';
  return rating.toFixed(1);
}

/** "in ~2 hr" / "in ~45 min" from avgDeliveryMinutes. (Legacy — most
 *  surfaces now lead with lead time, not delivery ETA.) */
export function formatEta(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hr = minutes / 60;
  return Number.isInteger(hr) ? `~${hr} hr` : `~${hr.toFixed(1)} hr`;
}

/**
 * Fulfillment lead time for a maker's item, from leadTimeHours.
 * Nearfold is a makers' marketplace — things are made/prepped to order, so
 * we frame time as "when it'll be ready", not a delivery countdown.
 *   <1h   → "ready within the hour"
 *   <24h  → "ready in ~3h"
 *   ≥24h  → "made to order · 2 days"
 */
export function formatLeadTime(hours: number): string {
  if (!hours || hours <= 1) return 'ready within the hour';
  if (hours < 24) return `ready in ~${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `made to order · ${days} day${days === 1 ? '' : 's'}`;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** day-of-week int (0=Sun) → "Mon". */
export function dayLabel(dow: number): string {
  return DAY_LABELS[dow] ?? '';
}

/** "HH:MM:SS" or "HH:MM" → "7:00 AM". Tolerates missing seconds. */
export function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  const h = Number(hStr);
  const m = Number(mStr ?? '0');
  if (Number.isNaN(h)) return t;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Relative "2 min ago" / "3 hr ago" / "Yesterday" / "12 May" for order timestamps. */
export function relativeTime(iso: string | Date): string {
  const then = typeof iso === 'string' ? new Date(iso) : iso;
  const diffMs = Date.now() - then.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
