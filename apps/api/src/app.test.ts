import { join } from 'node:path';
import type { Ingredient, Recipe } from '@cocktail-lab/core';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { loadCatalogue } from './catalogue.js';

const ingredients: Ingredient[] = [
  { id: 'white-rum', name: { es: 'Ron blanco', en: 'White rum' }, category: 'spirit', base: 'rum', measure: 'ml' },
  { id: 'pisco', name: { es: 'Pisco', en: 'Pisco' }, category: 'spirit', base: 'pisco', measure: 'ml' },
  { id: 'lime-juice', name: { es: 'Jugo de lima', en: 'Lime juice' }, category: 'juice', measure: 'ml' },
];

function recipe(id: string, patch: Partial<Recipe>): Recipe {
  return {
    schemaVersion: 1,
    id,
    family: 'sours',
    base: 'rum',
    name: { es: id, en: id },
    ingredients: [{ ingredientId: 'lime-juice', amount: 20, unit: 'ml' }],
    technique: 'shake',
    glass: 'coupe',
    ice: 'none',
    steps: { es: ['Agitar.'], en: ['Shake.'] },
    difficulty: 1,
    history: { es: 'Historia.', en: 'History.' },
    ...patch,
  };
}

const recipes: Recipe[] = [
  recipe('daiquiri', {
    name: { es: 'Daiquiri', en: 'Daiquiri' },
    ingredients: [
      { ingredientId: 'white-rum', amount: 60, unit: 'ml' },
      { ingredientId: 'lime-juice', amount: 20, unit: 'ml' },
    ],
  }),
  recipe('pisco-sour', {
    family: 'latin-american',
    base: 'pisco',
    name: { es: 'Pisco sour', en: 'Pisco Sour' },
    ingredients: [{ ingredientId: 'pisco', amount: 60, unit: 'ml' }],
    difficulty: 2,
  }),
  recipe('pina-colada', {
    family: 'tiki-tropical',
    name: { es: 'Piña colada', en: 'Piña Colada' },
    technique: 'blend',
    glass: 'tiki-mug',
    difficulty: 2,
  }),
];

let app: FastifyInstance;

function create(catalogue = { ingredients, recipes }): FastifyInstance {
  app = buildApp({ catalogue });
  return app;
}

/** Every shape the API answers with, so tests can read what they need. */
interface Json {
  items: { id: string }[];
  total: number;
  error: string;
  issues: { path: string; message: string }[];
}

async function get(url: string): Promise<{ status: number; body: Json }> {
  const response = await app.inject({ method: 'GET', url });
  return { status: response.statusCode, body: response.json<Json>() };
}

async function ids(query: string): Promise<string[]> {
  const { status, body } = await get(`/api/v1/recipes${query}`);
  expect(status).toBe(200);
  return body.items.map((item) => item.id);
}

afterEach(async () => {
  await app.close();
});

describe('GET /api/v1/health', () => {
  it('reports ok', async () => {
    create();
    expect(await get('/api/v1/health')).toEqual({ status: 200, body: { status: 'ok' } });
  });
});

describe('GET /api/v1/recipes', () => {
  it('lists summaries sorted by name, without steps or history', async () => {
    create();
    const { body } = await get('/api/v1/recipes');
    expect(body.total).toBe(3);
    expect(body.items.map((item) => item.id)).toEqual(['daiquiri', 'pina-colada', 'pisco-sour']);
    expect(body.items[0]).toEqual({
      id: 'daiquiri',
      family: 'sours',
      base: 'rum',
      name: { es: 'Daiquiri', en: 'Daiquiri' },
      technique: 'shake',
      glass: 'coupe',
      ice: 'none',
      difficulty: 1,
      ingredientIds: ['white-rum', 'lime-juice'],
    });
  });

  it('searches without case or accents', async () => {
    create();
    expect(await ids('?q=PINA')).toEqual(['pina-colada']);
    expect(await ids('?q=' + encodeURIComponent('piña'))).toEqual(['pina-colada']);
  });

  it('ANDs different filters and ORs repeated values', async () => {
    create();
    expect(await ids('?base=pisco&difficulty=2')).toEqual(['pisco-sour']);
    expect(await ids('?base=pisco&difficulty=1')).toEqual([]);
    expect(await ids('?base=pisco&base=rum')).toEqual(['daiquiri', 'pina-colada', 'pisco-sour']);
    expect(await ids('?family=sours&family=tiki-tropical&difficulty=2')).toEqual(['pina-colada']);
    expect(await ids('?ingredient=pisco&ingredient=white-rum')).toEqual(['daiquiri', 'pisco-sour']);
    expect(await ids('?glass=tiki-mug&technique=blend')).toEqual(['pina-colada']);
  });

  it('paginates', async () => {
    create();
    const { body } = await get('/api/v1/recipes?limit=2&page=2');
    expect(body.items.map((item) => item.id)).toEqual(['pisco-sour']);
    expect(body.total).toBe(3);
  });

  it('rejects a limit above 50 with the Zod issues', async () => {
    create();
    const { status, body } = await get(
      '/api/v1/recipes?limit=51',
    );
    expect(status).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.issues[0]?.path).toBe('/limit');
  });

  it.each(['?base=milk', '?difficulty=4', '?page=0', '?lang=fr', '?ingredient=Bad%20Id'])(
    'rejects invalid %s with 400',
    async (query) => {
      create();
      const { status, body } = await get(`/api/v1/recipes${query}`);
      expect(status).toBe(400);
      expect(body.issues.length).toBeGreaterThan(0);
    },
  );
});

describe('GET /api/v1/recipes/:id', () => {
  it('returns the full recipe', async () => {
    create();
    const { status, body } = await get('/api/v1/recipes/pisco-sour');
    expect(status).toBe(200);
    expect(body).toEqual(recipes[1]);
  });

  it('returns 404 for an unknown recipe', async () => {
    create();
    expect(await get('/api/v1/recipes/nope')).toEqual({
      status: 404,
      body: { error: 'Recipe not found' },
    });
  });

  it('returns 400 for a malformed id', async () => {
    create();
    expect((await get('/api/v1/recipes/Not%20A%20Slug')).status).toBe(400);
  });
});

describe('GET /api/v1/ingredients', () => {
  it('returns the catalogue', async () => {
    create();
    expect(await get('/api/v1/ingredients')).toEqual({ status: 200, body: ingredients });
  });
});

describe('errors', () => {
  it('returns 404 for unknown routes', async () => {
    create();
    expect(await get('/api/v1/nope')).toEqual({ status: 404, body: { error: 'Not Found' } });
    expect((await get('/recipes')).status).toBe(404);
  });

  it('answers the standard text of the status for framework 4xx errors', async () => {
    create();
    const tooLarge = await app.inject({
      method: 'POST',
      url: '/api/v1/costing',
      payload: { pad: 'x'.repeat(70 * 1024) },
    });
    expect(tooLarge.statusCode).toBe(413);
    expect(tooLarge.json()).toEqual({ error: 'Payload Too Large' });

    const unsupported = await app.inject({
      method: 'POST',
      url: '/api/v1/costing',
      headers: { 'content-type': 'application/xml' },
      payload: '<a/>',
    });
    expect(unsupported.statusCode).toBe(415);
    expect(unsupported.json()).toEqual({ error: 'Unsupported Media Type' });
  });

  it('returns 500 without details when a handler fails', async () => {
    // A recipe that breaks the response schema makes serialisation throw.
    create({ ingredients, recipes: [{ ...recipes[0], family: 'broken' } as unknown as Recipe] });
    const response = await app.inject({ method: 'GET', url: '/api/v1/recipes/daiquiri' });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: 'Internal Server Error' });
    expect(response.body).not.toMatch(/stack|zod|\.ts|node_modules/i);
  });
});

describe('the real catalogue', () => {
  it('loads from data/ and serves every recipe', async () => {
    const catalogue = loadCatalogue(join(import.meta.dirname, '..', '..', '..', 'data'));
    create(catalogue);
    const { body } = await get('/api/v1/recipes?limit=50');
    expect(body.total).toBe(catalogue.recipes.length);
    for (const { id } of catalogue.recipes) {
      expect((await get(`/api/v1/recipes/${id}`)).status).toBe(200);
    }
  });
});
