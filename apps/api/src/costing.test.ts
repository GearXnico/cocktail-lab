import type { Ingredient, Recipe } from '@cocktail-lab/core';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

const ingredients: Ingredient[] = [
  { id: 'white-rum', name: { es: 'Ron blanco', en: 'White rum' }, category: 'spirit', base: 'rum', measure: 'ml' },
  { id: 'pisco', name: { es: 'Pisco', en: 'Pisco' }, category: 'spirit', base: 'pisco', measure: 'ml' },
  { id: 'lime-juice', name: { es: 'Jugo de lima', en: 'Lime juice' }, category: 'juice', measure: 'ml' },
];

const daiquiri: Recipe = {
  schemaVersion: 1,
  id: 'daiquiri',
  family: 'sours',
  base: 'rum',
  name: { es: 'Daiquiri', en: 'Daiquiri' },
  ingredients: [
    { ingredientId: 'white-rum', amount: 60, unit: 'ml' },
    { ingredientId: 'lime-juice', amount: 20, unit: 'ml' },
  ],
  technique: 'shake',
  glass: 'coupe',
  ice: 'none',
  steps: { es: ['Agitar.'], en: ['Shake.'] },
  difficulty: 1,
  history: { es: 'Historia.', en: 'History.' },
};

const prices = [
  { ingredientId: 'white-rum', price: 12000, size: 750, measure: 'ml' },
  { ingredientId: 'lime-juice', price: 3000, size: 1000, measure: 'ml' },
];
const base = { wastePct: 0.1, targetCostPct: 0.25, taxPct: 0.19, currency: 'CLP' };

interface Costing {
  lines: { ingredientId: string; amount: number; unit: string; cost: number | null }[];
  drinkCost: number | null;
  netPrice: number | null;
  menuPrice: number | null;
  margin: number | null;
  marginPct: number | null;
  costPct: number | null;
  missing: string[];
  error: string;
  issues: { path: string; code: string }[];
}

let app: FastifyInstance;

async function post(payload: unknown): Promise<{ status: number; body: Costing }> {
  app = buildApp({ catalogue: { ingredients, recipes: [daiquiri] } });
  const response = await app.inject({ method: 'POST', url: '/api/v1/costing', payload: payload as object });
  return { status: response.statusCode, body: response.json<Costing>() };
}

afterEach(async () => {
  await app.close();
});

describe('POST /api/v1/costing', () => {
  it('costs a recipe by id', async () => {
    const { status, body } = await post({ ...base, recipeId: 'daiquiri', prices });
    // (60 × 16 + 20 × 3) = 1020; × 1.1 = 1122; rawNet 4488; × 1.19 = 5340.72 → 5400.
    expect(status).toBe(200);
    expect(body.lines).toEqual([
      { ingredientId: 'white-rum', amount: 60, unit: 'ml', cost: 960 },
      { ingredientId: 'lime-juice', amount: 20, unit: 'ml', cost: 60 },
    ]);
    expect(body.drinkCost).toBe(1122);
    expect(body.menuPrice).toBe(5400);
    expect(body.netPrice).toBe(4538);
    expect(body.margin).toBe(3416);
    expect(body.costPct).toBeCloseTo(1122 / (5400 / 1.19), 9);
    expect(body.marginPct).toBeCloseTo(1 - (body.costPct ?? 0), 9);
    expect(body.missing).toEqual([]);
  });

  it('costs ingredients sent in the body, with tax not included', async () => {
    const { status, body } = await post({
      wastePct: 0,
      targetCostPct: 0.2,
      taxIncluded: false,
      roundingStep: 0.5,
      currency: 'USD',
      ingredients: [{ ingredientId: 'white-rum', amount: 60, unit: 'ml' }],
      prices: [{ ingredientId: 'white-rum', price: 30, size: 750, measure: 'ml' }],
    });
    // 60 × 0.04 = 2.40; rawNet 12.00.
    expect(status).toBe(200);
    expect(body.drinkCost).toBe(2.4);
    expect(body.menuPrice).toBe(12);
    expect(body.netPrice).toBe(12);
    expect(body.margin).toBe(9.6);
  });

  it('reports an incomplete cost with missing[] and no totals, never zero', async () => {
    const { status, body } = await post({ ...base, recipeId: 'daiquiri', prices: [prices[0]] });
    expect(status).toBe(200);
    expect(body.missing).toEqual(['lime-juice']);
    expect(body.lines.map((line) => line.cost)).toEqual([960, null]);
    expect(body.drinkCost).toBeNull();
    expect(body.menuPrice).toBeNull();
    expect(body.netPrice).toBeNull();
    expect(body.margin).toBeNull();
    expect(body.marginPct).toBeNull();
    expect(body.costPct).toBeNull();
  });

  it('treats a price in another measure as missing', async () => {
    const { body } = await post({
      ...base,
      recipeId: 'daiquiri',
      prices: [prices[0], { ingredientId: 'lime-juice', price: 500, size: 1, measure: 'unit' }],
    });
    expect(body.missing).toEqual(['lime-juice']);
  });

  it('answers the same for the same body (stateless)', async () => {
    const first = await post({ ...base, recipeId: 'daiquiri', prices });
    const incomplete = await post({ ...base, recipeId: 'daiquiri', prices: [] });
    const second = await post({ ...base, recipeId: 'daiquiri', prices });
    expect(incomplete.body.missing).toEqual(['white-rum', 'lime-juice']);
    expect(second).toEqual(first);
  });

  it('returns 404 for an unknown recipe', async () => {
    expect(await post({ ...base, recipeId: 'nope', prices })).toEqual({
      status: 404,
      body: { error: 'Recipe not found' },
    });
  });

  it('rejects an unknown ingredient', async () => {
    const { status, body } = await post({
      ...base,
      prices,
      ingredients: [{ ingredientId: 'nope', amount: 1, unit: 'ml' }],
    });
    expect(status).toBe(400);
    expect(body.issues[0]).toMatchObject({ path: '/ingredients/0/ingredientId', code: 'unknown_ingredient' });
  });

  it('rejects a unit that does not fit the ingredient', async () => {
    const { status, body } = await post({
      ...base,
      prices,
      ingredients: [{ ingredientId: 'pisco', amount: 1, unit: 'unit' }],
    });
    expect(status).toBe(400);
    expect(body.issues[0]).toMatchObject({ path: '/ingredients/0/unit', code: 'unit_mismatch' });
  });

  const line = { ingredientId: 'pisco', amount: 1, unit: 'ml' };
  const withRecipe = { ...base, prices, recipeId: 'daiquiri' };

  it.each([
    ['neither recipeId nor ingredients', { ...base, prices }],
    ['both recipeId and ingredients', { ...withRecipe, ingredients: [line] }],
    ['a malformed currency', { ...withRecipe, currency: 'XXX1' }],
    ['a made-up currency', { ...withRecipe, currency: 'ZZZ' }],
    ['targetCostPct 0', { ...withRecipe, targetCostPct: 0 }],
    ['negative wastePct', { ...withRecipe, wastePct: -0.1 }],
    ['taxPct above 1', { ...withRecipe, taxPct: 2 }],
    ['roundingStep 0', { ...withRecipe, roundingStep: 0 }],
    ['a negative price', { ...withRecipe, prices: [{ ...prices[0], price: -1 }] }],
    ['a size of 0', { ...withRecipe, prices: [{ ...prices[0], size: 0 }] }],
    ['a size below 0.001', { ...withRecipe, prices: [{ ...prices[0], size: 0.0009 }] }],
    ['a price above 1e9', { ...withRecipe, prices: [{ ...prices[0], price: 1e9 + 1 }] }],
    ['targetCostPct below 0.01', { ...withRecipe, targetCostPct: 0.009 }],
    ['a duplicated price', { ...withRecipe, prices: [prices[0], prices[0]] }],
    ['an extra field', { ...withRecipe, extra: true }],
    ['a missing prices list', { ...base, recipeId: 'daiquiri' }],
    ['more than 30 lines', { ...base, prices, ingredients: Array.from({ length: 31 }, () => line) }],
    ['more than 100 prices', { ...withRecipe, prices: Array.from({ length: 101 }, () => prices[0]) }],
  ])('rejects %s with 400 and issues', async (_name, payload) => {
    const { status, body } = await post(payload);
    expect(status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it('accepts the limits themselves', async () => {
    const { status } = await post({
      ...withRecipe,
      targetCostPct: 0.01,
      prices: [
        { ingredientId: 'white-rum', price: 1e9, size: 0.001, measure: 'ml' },
        { ingredientId: 'lime-juice', price: 0, size: 1e9, measure: 'ml' },
      ],
    });
    expect(status).toBe(200);
  });

  it('answers 400, not 500, when the result is not finite', async () => {
    const { status, body } = await post({
      ...base,
      prices: [{ ingredientId: 'pisco', price: 1e9, size: 0.001, measure: 'ml' }],
      ingredients: [{ ingredientId: 'pisco', amount: 1e300, unit: 'ml' }],
    });
    expect(status).toBe(400);
    expect(body.issues[0]?.code).toBe('non_finite_result');
  });

  it('rejects a body above the size limit', async () => {
    app = buildApp({ catalogue: { ingredients, recipes: [daiquiri] } });
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/costing',
      payload: { ...withRecipe, pad: 'x'.repeat(20 * 1024) },
    });
    expect(response.statusCode).toBe(413);
    expect(response.json()).toEqual({ error: 'Bad Request' });
  });

  it('rejects malformed JSON without echoing it', async () => {
    app = buildApp({ catalogue: { ingredients, recipes: [daiquiri] } });
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/costing',
      headers: { 'content-type': 'application/json' },
      payload: '{"secret": ',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).not.toContain('secret');
  });
});
