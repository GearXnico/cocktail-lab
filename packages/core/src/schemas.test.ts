import { describe, expect, it } from 'vitest';
import { validIngredient, validRecipe } from './fixtures.js';
import { IngredientSchema, RecipeSchema } from './schemas.js';

describe('IngredientSchema', () => {
  it('accepts a valid ingredient', () => {
    expect(IngredientSchema.safeParse(validIngredient).success).toBe(true);
  });

  it('accepts a base without a distilled spirit', () => {
    const result = IngredientSchema.safeParse({
      ...validIngredient,
      id: 'prosecco',
      category: 'wine',
      base: 'sparkling-wine',
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['id that is not a slug', { id: 'Lime Juice' }],
    ['unknown category', { category: 'dairy' }],
    ['unknown base', { base: 'sake' }],
    ['unknown measure', { measure: 'oz' }],
    ['empty Spanish name', { name: { es: ' ', en: 'Lime juice' } }],
    ['missing English name', { name: { es: 'Jugo de lima' } }],
    ['unknown field', { color: 'green' }],
  ])('rejects %s', (_label, patch) => {
    expect(IngredientSchema.safeParse({ ...validIngredient, ...patch }).success).toBe(false);
  });
});

describe('RecipeSchema', () => {
  it('accepts a valid recipe', () => {
    expect(RecipeSchema.safeParse(validRecipe).success).toBe(true);
  });

  it('accepts garnish, topUp and sources', () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      garnish: { es: 'Lima', en: 'Lime' },
      ingredients: [{ ingredientId: 'soda', amount: 60, unit: 'ml', topUp: true }],
      sources: ['https://iba-world.com/iba-cocktail/daiquiri/'],
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['wrong schemaVersion', { schemaVersion: 2 }],
    ['unknown family', { family: 'shots' }],
    ['unknown technique', { technique: 'juggle' }],
    ['unknown glass', { glass: 'boot' }],
    ['unknown ice', { ice: 'snow' }],
    ['difficulty 4', { difficulty: 4 }],
    ['difficulty 0', { difficulty: 0 }],
    ['no ingredients', { ingredients: [] }],
    ['zero amount', { ingredients: [{ ingredientId: 'white-rum', amount: 0, unit: 'ml' }] }],
    ['negative amount', { ingredients: [{ ingredientId: 'white-rum', amount: -5, unit: 'ml' }] }],
    ['unknown unit', { ingredients: [{ ingredientId: 'white-rum', amount: 60, unit: 'oz' }] }],
    ['no English steps', { steps: { es: ['Agitar.'], en: [] } }],
    ['blank step', { steps: { es: [' '], en: ['Shake.'] } }],
    ['empty English history', { history: { es: 'Historia.', en: '' } }],
    ['source that is not a URL', { sources: ['iba'] }],
    ['unknown field', { rating: 5 }],
  ])('rejects %s', (_label, patch) => {
    expect(RecipeSchema.safeParse({ ...validRecipe, ...patch }).success).toBe(false);
  });

  it('rejects a recipe missing its name', () => {
    const rest: Partial<typeof validRecipe> = { ...validRecipe };
    delete rest.name;
    expect(RecipeSchema.safeParse(rest).success).toBe(false);
  });
});
