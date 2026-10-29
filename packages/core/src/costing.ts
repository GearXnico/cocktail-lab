import { amountInMeasure } from './units.js';
import type { Ingredient, RecipeIngredient } from './schemas.js';

export interface IngredientPrice {
  price: number;
  size: number;
  measure: Ingredient['measure'];
}

export type DrinkCost =
  | { complete: true; cost: number }
  | { complete: false; missing: string[] };

export interface PricingInput {
  /** Cost of the drink, waste included. */
  drinkCost: number;
  /** Target cost as a fraction of the net price, e.g. 0.25. */
  targetCostPct: number;
  /** Tax as a fraction, e.g. 0.19. Defaults to 0. */
  taxPct?: number;
  /** Whether the menu price includes tax. Defaults to true. */
  taxIncluded?: boolean;
  /** Defaults to `defaultRoundingStep(currency)`. */
  roundingStep?: number;
  currency: string;
  /** Replaces the calculated menu price; margins come from it. */
  priceOverride?: number;
}

export interface Pricing {
  menuPrice: number;
  netPrice: number;
  drinkCost: number;
  margin: number;
  marginPct: number;
  costPct: number;
}

/** Fraction digits of a currency, from `Intl.NumberFormat`. */
export function currencyDigits(currency: string): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

/** 100 for CLP; for any other currency its minor unit, i.e. no extra rounding. */
export function defaultRoundingStep(currency: string): number {
  return currency === 'CLP' ? 100 : 10 ** -currencyDigits(currency);
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON * Math.sign(value)) * factor) / factor;
}

/** Rounds up to a multiple of `step`, ignoring floating-point noise such as 1190.0000000001. */
function ceilToStep(value: number, step: number): number {
  const quotient = value / step;
  const nearest = Math.round(quotient);
  return (Math.abs(quotient - nearest) < 1e-9 ? nearest : Math.ceil(quotient)) * step;
}

/** Price of one ml, unit or g. */
export function unitCost(price: number, size: number): number {
  if (!(price >= 0) || !(size > 0)) {
    throw new RangeError('price must be 0 or more and size more than 0');
  }
  return price / size;
}

/**
 * `Σ(amount_in_measure × unitCost) × (1 + wastePct)`. An ingredient with no
 * price, or priced in a different measure, makes the cost incomplete and is
 * listed in `missing`; it is never counted as zero. Rounded to the currency's
 * fraction digits.
 */
export function drinkCost(
  recipeIngredients: readonly RecipeIngredient[],
  ingredients: ReadonlyMap<string, Ingredient>,
  prices: Readonly<Record<string, IngredientPrice | undefined>>,
  wastePct: number,
  currency: string,
): DrinkCost {
  if (!(wastePct >= 0)) throw new RangeError('wastePct must be 0 or more');
  const missing: string[] = [];
  let sum = 0;
  for (const line of recipeIngredients) {
    const ingredient = ingredients.get(line.ingredientId);
    if (!ingredient) throw new RangeError(`Unknown ingredient "${line.ingredientId}"`);
    const price = prices[line.ingredientId];
    if (price?.measure !== ingredient.measure) {
      missing.push(line.ingredientId);
      continue;
    }
    sum += amountInMeasure(line.amount, line.unit, ingredient.measure) * unitCost(price.price, price.size);
  }
  if (missing.length > 0) return { complete: false, missing };
  return { complete: true, cost: roundTo(sum * (1 + wastePct), currencyDigits(currency)) };
}

/**
 * Menu price and margins from a drink cost. Tax included (default):
 * `menuPrice = ceil(rawNet × (1 + taxPct) / step) × step`. Tax not included:
 * `menuPrice = netPrice = ceil(rawNet / step) × step`. Margins come from the
 * rounded price. Money is rounded once, at the end, to the currency's digits.
 */
export function priceDrink(input: PricingInput): Pricing {
  const { drinkCost: cost, targetCostPct, currency, priceOverride } = input;
  const taxPct = input.taxPct ?? 0;
  const taxIncluded = input.taxIncluded ?? true;
  const step = input.roundingStep ?? defaultRoundingStep(currency);
  if (!(cost >= 0)) throw new RangeError('drinkCost must be 0 or more');
  if (!(targetCostPct > 0 && targetCostPct <= 1)) {
    throw new RangeError('targetCostPct must be more than 0 and at most 1');
  }
  if (!(taxPct >= 0)) throw new RangeError('taxPct must be 0 or more');
  if (!(step > 0)) throw new RangeError('roundingStep must be more than 0');
  if (priceOverride !== undefined && !(priceOverride > 0)) {
    throw new RangeError('priceOverride must be more than 0');
  }

  const rawNet = cost / targetCostPct;
  const divisor = taxIncluded ? 1 + taxPct : 1;
  const menuPrice = priceOverride ?? ceilToStep(rawNet * divisor, step);
  const netPrice = menuPrice / divisor;
  const margin = netPrice - cost;
  const digits = currencyDigits(currency);
  return {
    menuPrice: roundTo(menuPrice, digits),
    netPrice: roundTo(netPrice, digits),
    drinkCost: roundTo(cost, digits),
    margin: roundTo(margin, digits),
    marginPct: margin / netPrice,
    costPct: cost / netPrice,
  };
}
