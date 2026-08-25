/**
 * Prices are whole units of a millionth of a point, money is whole cents. Both
 * are integers because MySQL DECIMAL reaches drizzle as a string and a float
 * cannot hold a tick grid of 0.0005 without drifting.
 */
export const PRICE_SCALE = 1_000_000;

export const toPrice = (units: number) => units / PRICE_SCALE;

export const priceUnits = (price: number) => Math.round(price * PRICE_SCALE);

export const toDollars = (cents: number) => cents / 100;

export const cents = (dollars: number) => Math.round(dollars * 100);

/**
 * Every tick in the contract list is a whole number of cents, so the division
 * is exact on the grid. The rounding is only reached by an off-grid mark.
 */
export const valueOfMove = (units: number, quantity: number, pointCents: number) =>
  Math.round((units * quantity * pointCents) / PRICE_SCALE);
