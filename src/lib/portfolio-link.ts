/**
 * One-shot handoff for cross-tab deep links into the portfolio: the Six
 * Levers tab sets a lever filter, navigates, and PortfolioView consumes it
 * once on mount. Deliberately not URL/session state — a plain in-memory
 * hand-off that resets naturally.
 */
let pendingLever: string | null = null;

export function setPortfolioLeverFilter(leverId: string) {
  pendingLever = leverId;
}

export function consumePortfolioLeverFilter(): string | null {
  const value = pendingLever;
  pendingLever = null;
  return value;
}
