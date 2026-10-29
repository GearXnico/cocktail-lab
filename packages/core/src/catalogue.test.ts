import { describe, expect, it } from 'vitest';
import { MIN_RECIPES_PER_FAMILY, validateCatalogue } from './catalogue.js';
import type { RecipeEntry } from './catalogue.js';
import { validIngredient, validRecipe } from './fixtures.js';
import { FAMILIES } from './schemas.js';
import type { Ingredient, Recipe } from './schemas.js';

const rum: Ingredient = {
  id: 'white-rum',
  name: { es: 'Ron blanco', en: 'White rum' },
  category: 'spirit',
  base: 'rum',
  measure: 'ml',
};
const ingredients = [rum, validIngredient];

function entry(patch: Partial<Recipe> = {}, folder = 'sours', slug = 'daiquiri'): RecipeEntry {
  return { folder, slug, recipe: { ...validRecipe, ...patch } };
}

function complete(): RecipeEntry[] {
  return FAMILIES.flatMap((family) =>
    Array.from({ length: MIN_RECIPES_PER_FAMILY }, (_, index) => {
      const slug = `${family}-${String(index)}`;
      return entry({ id: slug, family }, family, slug);
    }),
  );
}

describe('validateCatalogue', () => {
  it('accepts a consistent catalogue and warns about the families that lack recipes', () => {
    const { errors, warnings } = validateCatalogue(ingredients, [entry()]);
    expect(errors).toEqual([]);
    expect(warnings).toContain('family "sours" has 1 of 5 recipes');
    expect(warnings).toContain('family "latin-american" has 0 of 5 recipes');
  });

  it('fails the families that lack recipes in release mode', () => {
    const { errors } = validateCatalogue(ingredients, [entry()], { release: true });
    expect(errors).toContain('family "sours" has 1 of 5 recipes');
    expect(errors).toHaveLength(FAMILIES.length);
  });

  it('accepts a release with 5 recipes in every family', () => {
    expect(validateCatalogue(ingredients, complete(), { release: true }).errors).toEqual([]);
  });

  it('rejects duplicate ingredient ids', () => {
    const { errors } = validateCatalogue([...ingredients, rum], [entry()]);
    expect(errors).toContain('ingredients: duplicate id "white-rum"');
  });

  it('rejects duplicate recipe ids', () => {
    const { errors } = validateCatalogue(ingredients, [entry(), entry({}, 'sours', 'daiquiri-2')]);
    expect(errors).toContain('recipes: duplicate id "daiquiri"');
  });

  it('rejects an unknown ingredient', () => {
    const { errors } = validateCatalogue(ingredients, [
      entry({ ingredients: [{ ingredientId: 'unobtainium', amount: 1, unit: 'ml' }] }),
    ]);
    expect(errors).toContain('recipe "daiquiri": unknown ingredient "unobtainium"');
  });

  it('rejects an ingredient listed twice in a recipe', () => {
    const line = { ingredientId: 'white-rum', amount: 30, unit: 'ml' } as const;
    const { errors } = validateCatalogue(ingredients, [entry({ ingredients: [line, line] })]);
    expect(errors).toContain('recipe "daiquiri": ingredient "white-rum" is listed more than once');
  });

  it('rejects a unit that does not fit the ingredient measure', () => {
    const { errors } = validateCatalogue(ingredients, [
      entry({ ingredients: [{ ingredientId: 'white-rum', amount: 2, unit: 'unit' }] }),
    ]);
    expect(errors).toContain(
      'recipe "daiquiri": unit "unit" does not fit "white-rum", which is measured in ml',
    );
  });

  it('accepts barspoon for an ingredient measured in grams', () => {
    const sugar: Ingredient = {
      id: 'superfine-sugar',
      name: { es: 'Azúcar extrafina', en: 'Superfine sugar' },
      category: 'other',
      measure: 'g',
    };
    const { errors } = validateCatalogue(
      [...ingredients, sugar],
      [entry({ ingredients: [{ ingredientId: 'superfine-sugar', amount: 2, unit: 'barspoon' }] })],
    );
    expect(errors).toEqual([]);
  });

  it('rejects an id that differs from the file name', () => {
    const { errors } = validateCatalogue(ingredients, [entry({}, 'sours', 'other-name')]);
    expect(errors).toContain('recipe "daiquiri": id must match the file name "other-name"');
  });

  it('rejects a family that differs from the folder', () => {
    const { errors } = validateCatalogue(ingredients, [entry({}, 'tiki-tropical')]);
    expect(errors).toContain('recipe "daiquiri": family "sours" must match the folder "tiki-tropical"');
  });

  it('rejects different numbers of Spanish and English steps', () => {
    const { errors } = validateCatalogue(ingredients, [
      entry({ steps: { es: ['Uno.', 'Dos.'], en: ['One.'] } }),
    ]);
    expect(errors).toContain('recipe "daiquiri": 2 Spanish steps but 1 English steps');
  });

  it('warns about an ingredient that no recipe uses', () => {
    const { warnings } = validateCatalogue([...ingredients, { ...rum, id: 'dark-rum' }], [entry()]);
    expect(warnings).toContain('ingredient "dark-rum" is not used by any recipe');
  });
});
