// Perf instrumentation — measure against the Phase 04 budgets.
//
// Budgets (from "Nearfold — Perceived Performance · Phase 04"):
//   cold start    < 1500 ms   (app launch → first interactive screen)
//   first content <  400 ms   (screen mount → first data painted)
//   tap ack       <  100 ms   (press → visual feedback)
//   animations      60 fps    (measured via tooling, not here)
//   bundle        < 1.8 MB    (measured at build, not runtime)
//
// This module records named marks and warns (dev) / breadcrumbs (prod)
// when a span blows its budget, so regressions surface during everyday use
// instead of only in a formal audit.

import { addBreadcrumb } from './sentry';

const COLD_START_AT = Date.now();
const marks = new Map<string, number>();

export const PerfBudget = {
  coldStartMs: 1500,
  firstContentMs: 400,
  tapAckMs: 100,
} as const;

export function mark(name: string) {
  marks.set(name, Date.now());
}

/**
 * Measure elapsed time since a prior mark (or since cold start if omitted)
 * and check it against an optional budget.
 */
export function measure(name: string, opts?: { since?: string; budgetMs?: number }): number {
  const now = Date.now();
  const start = opts?.since ? (marks.get(opts.since) ?? now) : COLD_START_AT;
  const elapsed = now - start;

  if (opts?.budgetMs != null && elapsed > opts.budgetMs) {
    const msg = `⏱️ ${name} took ${elapsed}ms (budget ${opts.budgetMs}ms)`;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(msg);
    }
    addBreadcrumb({ category: 'perf', message: name, level: 'warning', data: { elapsed, budget: opts.budgetMs } });
  }
  return elapsed;
}

/** Call when the first interactive screen has painted. */
export function markColdStartComplete() {
  measure('cold_start', { budgetMs: PerfBudget.coldStartMs });
}

/**
 * Wrap a press handler to assert the tap-ack budget. Usage:
 *   onPress={withTapAck('add_to_cart', handleAdd)}
 */
export function withTapAck<T extends (...args: never[]) => void>(label: string, fn: T): T {
  return ((...args: Parameters<T>) => {
    const t0 = Date.now();
    fn(...args);
    const dt = Date.now() - t0;
    if (dt > PerfBudget.tapAckMs && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`⏱️ tap "${label}" blocked JS ${dt}ms (budget ${PerfBudget.tapAckMs}ms)`);
    }
  }) as T;
}
