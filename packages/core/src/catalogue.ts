import { FAMILIES } from './schemas.js';
import type { Ingredient, Recipe, RecipeIngredient } from './schemas.js';

export const MIN_RECIPES_PER_FAMILY = 5;

/** A recipe with the location of its file: `data/recipes/<folder>/<slug>.json`. */
export interface RecipeEntry {
  folder: string;
  slug: string;
  recipe: Recipe;
}

export interface CatalogueReport {
  errors: string[];
  warnings: string[];
}

const COMPATIBLE_UNITS: Record<Ingredient['measure'], readonly RecipeIngredient['unit'][]> = {
  ml: ['ml', 'dash', 'barspoon'],
  unit: ['unit'],
  // A barspoon of dry sugar is a volume; converting it to grams is up to costing.
  g: ['g', 'barspoon'],
};

function duplicates(values: readonly string[]): string[] {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

/**
 * Checks the rules that span several files. Each file is validated against its
 * schema beforehand. The minimum of recipes per family is a warning, and an
 * error only when `release` is set.
 */
export function validateCatalogue(
  ingredients: readonly Ingredient[],
  entries: readonly RecipeEntry[],
  options: { release?: boolean } = {},
): CatalogueReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const id of duplicates(ingredients.map((ingredient) => ingredient.id))) {
    errors.push(`ingredients: duplicate id "${id}"`);
  }
  for (const id of duplicates(entries.map(({ recipe }) => recipe.id))) {
    errors.push(`recipes: duplicate id "${id}"`);
  }

  const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  for (const { folder, slug, recipe } of entries) {
    const where = `recipe "${recipe.id}"`;
    if (recipe.id !== slug) {
      errors.push(`${where}: id must match the file name "${slug}"`);
    }
    if (recipe.family !== folder) {
      errors.push(`${where}: family "${recipe.family}" must match the folder "${folder}"`);
    }
    if (recipe.steps.es.length !== recipe.steps.en.length) {
      errors.push(
        `${where}: ${String(recipe.steps.es.length)} Spanish steps but ${String(recipe.steps.en.length)} English steps`,
      );
    }
    for (const id of duplicates(recipe.ingredients.map((line) => line.ingredientId))) {
      errors.push(`${where}: ingredient "${id}" is listed more than once`);
    }
    for (const line of recipe.ingredients) {
      const ingredient = byId.get(line.ingredientId);
      if (!ingredient) {
        errors.push(`${where}: unknown ingredient "${line.ingredientId}"`);
      } else if (!COMPATIBLE_UNITS[ingredient.measure].includes(line.unit)) {
        errors.push(
          `${where}: unit "${line.unit}" does not fit "${ingredient.id}", which is measured in ${ingredient.measure}`,
        );
      }
    }
  }

  for (const { id } of ingredients) {
    const used = entries.some(({ recipe }) => recipe.ingredients.some((line) => line.ingredientId === id));
    if (!used) {
      warnings.push(`ingredient "${id}" is not used by any recipe`);
    }
  }

  for (const family of FAMILIES) {
    const count = entries.filter(({ recipe }) => recipe.family === family).length;
    if (count < MIN_RECIPES_PER_FAMILY) {
      const message = `family "${family}" has ${String(count)} of ${String(MIN_RECIPES_PER_FAMILY)} recipes`;
      (options.release ? errors : warnings).push(message);
    }
  }

  return { errors, warnings };
}
