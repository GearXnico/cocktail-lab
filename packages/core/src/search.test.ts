import { describe, expect, it } from 'vitest';
import { validRecipe } from './fixtures.js';
import { MAX_PAGE_SIZE, normalizeText, searchRecipes, summarizeRecipe } from './search.js';
import type { Recipe } from './schemas.js';

function recipe(id: string, patch: Partial<Recipe> = {}): Recipe {
  return { ...validRecipe, id, name: { es: id, en: id }, ...patch };
}

const piscoSour = recipe('pisco-sour', {
  family: 'latin-american',
  base: 'pisco',
  name: { es: 'Pisco sour', en: 'Pisco Sour' },
  ingredients: [{ ingredientId: 'pisco', amount: 60, unit: 'ml' }],
});
const pinaColada = recipe('pina-colada', {
  family: 'tiki-tropical',
  name: { es: 'Piña colada', en: 'Piña Colada' },
  technique: 'blend',
  glass: 'tiki-mug',
  difficulty: 2,
  ingredients: [
    { ingredientId: 'white-rum', amount: 50, unit: 'ml' },
    { ingredientId: 'coconut-cream', amount: 30, unit: 'ml' },
  ],
});
const daiquiri = recipe('daiquiri', { name: { es: 'Daiquiri', en: 'Daiquiri' } });
const all = [piscoSour, pinaColada, daiquiri];

function ids(query: Parameters<typeof searchRecipes>[1]): string[] {
  return searchRecipes(all, query).items.map((item) => item.id);
}

describe('normalizeText', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(normalizeText('  Piña   COLADA ')).toBe('pina colada');
    expect(normalizeText('Cachaça')).toBe('cachaca');
  });
});

describe('searchRecipes', () => {
  it('returns everything sorted by name when there is no query', () => {
    expect(ids({})).toEqual(['daiquiri', 'pina-colada', 'pisco-sour']);
  });

  it('matches names without case or accents, in either language', () => {
    expect(ids({ q: 'PINA' })).toEqual(['pina-colada']);
    expect(ids({ q: 'piña' })).toEqual(['pina-colada']);
    expect(ids({ q: 'pisco sour' })).toEqual(['pisco-sour']);
    expect(ids({ q: 'zzz' })).toEqual([]);
  });

  it('combines different filters with AND', () => {
    expect(ids({ base: ['rum'], technique: ['blend'] })).toEqual(['pina-colada']);
    expect(ids({ base: ['rum'], difficulty: [2], family: ['sours'] })).toEqual([]);
  });

  it('combines the values of one filter with OR', () => {
    expect(ids({ base: ['pisco', 'rum'] })).toEqual(['daiquiri', 'pina-colada', 'pisco-sour']);
    expect(ids({ glass: ['tiki-mug', 'coupe'] })).toEqual(['pina-colada']);
    expect(ids({ ingredient: ['pisco', 'coconut-cream'] })).toEqual(['pina-colada', 'pisco-sour']);
  });

  it('treats an empty filter as no filter', () => {
    expect(ids({ base: [], ingredient: [] })).toHaveLength(3);
  });

  it('sorts by the name in the chosen language', () => {
    const swapped = [
      recipe('a', { name: { es: 'Zeta', en: 'Alpha' } }),
      recipe('b', { name: { es: 'Alfa', en: 'Zulu' } }),
    ];
    expect(searchRecipes(swapped, { lang: 'es' }).items.map((r) => r.id)).toEqual(['b', 'a']);
    expect(searchRecipes(swapped, { lang: 'en' }).items.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('paginates and reports the total before pagination', () => {
    const page = searchRecipes(all, { limit: 2, page: 2 });
    expect(page.items.map((item) => item.id)).toEqual(['pisco-sour']);
    expect(page.total).toBe(3);
    expect(searchRecipes(all, { limit: 2, page: 9 })).toEqual({ items: [], total: 3 });
  });

  it('caps the page size', () => {
    const many = Array.from({ length: MAX_PAGE_SIZE + 10 }, (_, i) => recipe(`r-${String(i)}`));
    expect(searchRecipes(many, { limit: 1000 }).items).toHaveLength(MAX_PAGE_SIZE);
    expect(searchRecipes(many, { limit: 0 }).items).toHaveLength(1);
  });
});

describe('summarizeRecipe', () => {
  it('keeps the card fields and the ingredient ids only', () => {
    const summary = summarizeRecipe(pinaColada);
    expect(summary.ingredientIds).toEqual(['white-rum', 'coconut-cream']);
    expect(summary).not.toHaveProperty('steps');
    expect(summary).not.toHaveProperty('history');
  });
});
