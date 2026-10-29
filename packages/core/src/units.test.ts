import { describe, expect, it } from 'vitest';
import { amountInMeasure, displayAmount, mlToOz, toMl } from './units.js';

describe('toMl', () => {
  it.each([
    [60, 'ml', 60],
    [1, 'dash', 0.8],
    [2, 'dash', 1.6],
    [1, 'barspoon', 5],
    [2, 'barspoon', 10],
  ] as const)('%f %s is %f ml', (amount, unit, expected) => {
    expect(toMl(amount, unit)).toBeCloseTo(expected, 10);
  });
});

describe('amountInMeasure', () => {
  it.each([
    [45, 'ml', 'ml', 45],
    [2, 'dash', 'ml', 1.6],
    [1, 'barspoon', 'ml', 5],
    [3, 'unit', 'unit', 3],
    [8, 'g', 'g', 8],
    [1, 'barspoon', 'g', 4],
    [2, 'barspoon', 'g', 8],
  ] as const)('%f %s as %s is %f', (amount, unit, measure, expected) => {
    expect(amountInMeasure(amount, unit, measure)).toBeCloseTo(expected, 10);
  });

  it.each([
    ['g', 'ml'],
    ['dash', 'g'],
    ['ml', 'unit'],
    ['unit', 'ml'],
  ] as const)('rejects %s for an ingredient measured in %s', (unit, measure) => {
    expect(() => amountInMeasure(1, unit, measure)).toThrow(RangeError);
  });
});

describe('mlToOz', () => {
  it.each([
    [0, 0],
    [0.8, 0.25],
    [3, 0.25],
    [3.75, 0.25],
    [5, 0.25],
    [10, 0.25],
    [15, 0.5],
    [20, 0.75],
    [22.5, 0.75],
    [25, 0.75],
    [30, 1],
    [40, 1.25],
    [45, 1.5],
    [60, 2],
    [75, 2.5],
    [90, 3],
  ])('%f ml is %f oz', (ml, oz) => {
    expect(mlToOz(ml)).toBe(oz);
  });
});

describe('displayAmount', () => {
  it.each([
    // [line, displayUnit, expected]
    [{ amount: 60, unit: 'ml' }, 'oz', { amount: 2, unit: 'oz' }],
    [{ amount: 60, unit: 'ml' }, 'ml', { amount: 60, unit: 'ml' }],
    [{ amount: 5, unit: 'ml' }, 'oz', { amount: 0.25, unit: 'oz' }],
    [{ amount: 1, unit: 'ml' }, 'oz', { amount: 0.25, unit: 'oz' }],
    [{ amount: 2, unit: 'dash' }, 'oz', { amount: 2, unit: 'dash' }],
    [{ amount: 2, unit: 'barspoon' }, 'oz', { amount: 2, unit: 'barspoon' }],
    [{ amount: 90, unit: 'ml', topUp: true }, 'oz', { amount: 90, unit: 'ml' }],
    [{ amount: 90, unit: 'ml', topUp: false }, 'oz', { amount: 3, unit: 'oz' }],
    [{ amount: 2, unit: 'unit' }, 'oz', { amount: 2, unit: 'unit' }],
    [{ amount: 8, unit: 'g' }, 'oz', { amount: 8, unit: 'g' }],
  ] as const)('%o shown in %s is %o', (line, displayUnit, expected) => {
    expect(displayAmount(line, displayUnit)).toEqual(expected);
  });
});
