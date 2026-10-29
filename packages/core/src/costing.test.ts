import { describe, expect, it } from 'vitest';
import {
  currencyDigits,
  defaultRoundingStep,
  drinkCost,
  priceDrink,
  unitCost,
} from './costing.js';
import type { IngredientPrice } from './costing.js';
import type { Ingredient } from './schemas.js';

function ingredient(id: string, category: Ingredient['category'], measure: Ingredient['measure']): [string, Ingredient] {
  return [id, { id, name: { es: id, en: id }, category, measure }];
}

const ingredients = new Map<string, Ingredient>([
  ingredient('white-rum', 'spirit', 'ml'),
  ingredient('lime-juice', 'juice', 'ml'),
  ingredient('superfine-sugar', 'other', 'g'),
  ingredient('mint', 'fresh', 'unit'),
]);

// CLP: rum 20/ml, lime 2/ml, sugar 1/g, mint 50 each.
const prices: Record<string, IngredientPrice> = {
  'white-rum': { price: 14000, size: 700, measure: 'ml' },
  'lime-juice': { price: 2000, size: 1000, measure: 'ml' },
  'superfine-sugar': { price: 1000, size: 1000, measure: 'g' },
  mint: { price: 500, size: 10, measure: 'unit' },
};

describe('unitCost', () => {
  it('divides price by size', () => {
    expect(unitCost(14000, 700)).toBe(20);
  });

  it.each([
    [-1, 10],
    [10, 0],
    [10, -5],
    [Number.NaN, 10],
  ])('rejects price %f, size %f', (price, size) => {
    expect(() => unitCost(price, size)).toThrow(RangeError);
  });
});

describe('currency helpers', () => {
  it.each([
    ['CLP', 0, 100],
    ['USD', 2, 0.01],
    ['EUR', 2, 0.01],
    ['JPY', 0, 1],
  ])('%s has %i digits and default step %f', (currency, digits, step) => {
    expect(currencyDigits(currency)).toBe(digits);
    expect(defaultRoundingStep(currency)).toBe(step);
  });
});

describe('drinkCost', () => {
  const daiquiri = [
    { ingredientId: 'white-rum', amount: 60, unit: 'ml' },
    { ingredientId: 'lime-juice', amount: 20, unit: 'ml' },
    { ingredientId: 'superfine-sugar', amount: 2, unit: 'barspoon' },
  ] as const;

  it.each([
    // 60×20 + 20×2 + 10×1 = 1250
    [0, 1250],
    [0.1, 1375],
    [0.2, 1500],
  ])('daiquiri with %f waste costs %f CLP', (wastePct, expected) => {
    expect(drinkCost(daiquiri, ingredients, prices, wastePct, 'CLP')).toEqual({
      complete: true,
      cost: expected,
    });
  });

  it('converts dashes and units', () => {
    const lines = [
      { ingredientId: 'lime-juice', amount: 5, unit: 'dash' },
      { ingredientId: 'mint', amount: 2, unit: 'unit' },
    ] as const;
    // 4 ml × 2 + 2 × 50 = 108
    expect(drinkCost(lines, ingredients, prices, 0, 'CLP')).toEqual({ complete: true, cost: 108 });
  });

  it('rounds once, at the end, to the currency digits', () => {
    const usd: Record<string, IngredientPrice> = { 'lime-juice': { price: 1, size: 3, measure: 'ml' } };
    const lines = [{ ingredientId: 'lime-juice', amount: 10, unit: 'ml' }] as const;
    expect(drinkCost(lines, ingredients, usd, 0, 'USD')).toEqual({ complete: true, cost: 3.33 });
  });

  it('lists unpriced ingredients instead of counting them as zero', () => {
    const partial: Record<string, IngredientPrice> = { ...prices };
    delete partial['superfine-sugar'];
    expect(drinkCost(daiquiri, ingredients, partial, 0.1, 'CLP')).toEqual({
      complete: false,
      missing: ['superfine-sugar'],
    });
  });

  it('treats a price in another measure as missing', () => {
    const wrong: Record<string, IngredientPrice> = {
      ...prices,
      'white-rum': { price: 10, size: 1, measure: 'g' },
    };
    expect(drinkCost(daiquiri, ingredients, wrong, 0, 'CLP')).toEqual({
      complete: false,
      missing: ['white-rum'],
    });
  });

  it('throws on an ingredient missing from the catalogue or a negative waste', () => {
    const lines = [{ ingredientId: 'nope', amount: 1, unit: 'ml' }] as const;
    expect(() => drinkCost(lines, ingredients, prices, 0, 'CLP')).toThrow(RangeError);
    expect(() => drinkCost(daiquiri, ingredients, prices, -0.1, 'CLP')).toThrow(RangeError);
  });
});

describe('priceDrink', () => {
  // rawNet = 1375 / 0.25 = 5500
  it('CLP, tax included: rounds the price with tax up to 100', () => {
    // 5500 × 1.19 = 6545 → 6600; net 6600 / 1.19 = 5546.218…
    const result = priceDrink({ drinkCost: 1375, targetCostPct: 0.25, taxPct: 0.19, currency: 'CLP' });
    expect(result).toMatchObject({ menuPrice: 6600, netPrice: 5546, drinkCost: 1375, margin: 4171 });
    expect(result.costPct).toBeCloseTo(1375 / (6600 / 1.19), 10);
    expect(result.marginPct).toBeCloseTo(1 - 1375 / (6600 / 1.19), 10);
  });

  it('CLP, tax not included: rounds the net price up to 100', () => {
    const result = priceDrink({
      drinkCost: 1375,
      targetCostPct: 0.25,
      taxPct: 0.19,
      taxIncluded: false,
      currency: 'CLP',
    });
    expect(result).toMatchObject({ menuPrice: 5500, netPrice: 5500, margin: 4125 });
    expect(result.costPct).toBeCloseTo(0.25, 10);
  });

  it('CLP, no tax set', () => {
    // rawNet 5560 → 5600
    const result = priceDrink({ drinkCost: 1390, targetCostPct: 0.25, currency: 'CLP' });
    expect(result).toMatchObject({ menuPrice: 5600, netPrice: 5600, margin: 4210 });
  });

  it('an exact multiple of the step is not pushed up', () => {
    expect(priceDrink({ drinkCost: 1375, targetCostPct: 0.25, currency: 'CLP' }).menuPrice).toBe(5500);
  });

  it.each([
    // [cost, target, tax, included, menu, net, margin]
    [1.8, 0.25, 0.1, true, 7.92, 7.2, 5.4],
    [1.8, 0.25, 0.1, false, 7.2, 7.2, 5.4],
    [1.9, 0.3, 0, true, 6.34, 6.34, 4.44],
    [1.9, 0.3, 0.2, true, 7.6, 6.33, 4.43],
  ])(
    'USD, no extra rounding: cost %f, target %f, tax %f, included %s',
    (cost, target, tax, included, menu, net, margin) => {
      const result = priceDrink({
        drinkCost: cost,
        targetCostPct: target,
        taxPct: tax,
        taxIncluded: included,
        currency: 'USD',
      });
      expect(result).toMatchObject({ menuPrice: menu, netPrice: net, margin });
    },
  );

  it('EUR with an explicit step of 0.5', () => {
    // rawNet 6.333… → 6.5
    const result = priceDrink({ drinkCost: 1.9, targetCostPct: 0.3, roundingStep: 0.5, currency: 'EUR' });
    expect(result).toMatchObject({ menuPrice: 6.5, netPrice: 6.5, margin: 4.6 });
  });

  it('JPY rounds to whole yen', () => {
    // 250 / 0.3 = 833.33… → 834
    expect(priceDrink({ drinkCost: 250, targetCostPct: 0.3, currency: 'JPY' }).menuPrice).toBe(834);
  });

  it('uses a price override with the same formulas', () => {
    const result = priceDrink({
      drinkCost: 1375,
      targetCostPct: 0.25,
      taxPct: 0.19,
      priceOverride: 7000,
      currency: 'CLP',
    });
    expect(result).toMatchObject({ menuPrice: 7000, netPrice: 5882, margin: 4507 });
    expect(result.costPct).toBeCloseTo(1375 / (7000 / 1.19), 10);
  });

  it.each([
    { drinkCost: -1 },
    { targetCostPct: 0 },
    { targetCostPct: 1.5 },
    { taxPct: -0.1 },
    { roundingStep: 0 },
    { priceOverride: 0 },
  ])('rejects %o', (patch) => {
    expect(() =>
      priceDrink({ drinkCost: 1000, targetCostPct: 0.25, currency: 'CLP', ...patch }),
    ).toThrow(RangeError);
  });
});
