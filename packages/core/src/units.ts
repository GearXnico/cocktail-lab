import type { Ingredient, RecipeIngredient } from './schemas.js';

/** Millilitres in one unit of each volume unit. */
export const ML_PER_UNIT = {
  ml: 1,
  dash: 0.8,
  barspoon: 5,
} as const;

export const ML_PER_OZ = 30;

/**
 * A barspoon of an ingredient measured in grams (dry sugar) counts as 5 g:
 * its 5 ml taken at 1 g/ml. The same nominal approximation as a `topUp` amount.
 */
const GRAMS_PER_BARSPOON = 5;

function isVolumeUnit(unit: RecipeIngredient['unit']): unit is keyof typeof ML_PER_UNIT {
  return unit in ML_PER_UNIT;
}

/** Converts an amount in ml, dash or barspoon to ml. */
export function toMl(amount: number, unit: keyof typeof ML_PER_UNIT): number {
  return amount * ML_PER_UNIT[unit];
}

/**
 * Converts a recipe amount to the measure its ingredient is priced in (ml,
 * unit or g). Throws when the unit does not fit the measure; `validateCatalogue`
 * rejects such recipes beforehand.
 */
export function amountInMeasure(
  amount: number,
  unit: RecipeIngredient['unit'],
  measure: Ingredient['measure'],
): number {
  if (measure === 'ml' && isVolumeUnit(unit)) return toMl(amount, unit);
  if (measure === 'g') {
    if (unit === 'g') return amount;
    if (unit === 'barspoon') return amount * GRAMS_PER_BARSPOON;
  }
  if (measure === 'unit' && unit === 'unit') return amount;
  throw new RangeError(`Unit "${unit}" does not fit an ingredient measured in "${measure}"`);
}

/**
 * Converts ml to ounces for display only, rounded to the nearest quarter
 * ounce (ties go up). Costing always stays in ml.
 */
export function mlToOz(ml: number): number {
  return Math.round((ml / ML_PER_OZ) * 4) / 4;
}
