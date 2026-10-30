import type { Base, Family, Localized, Recipe } from './schemas.js';

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 20;

export type Language = keyof Localized;

/** What the list shows of a recipe: enough to render a card and filter. */
export interface RecipeSummary {
  id: string;
  family: Family;
  base: Base;
  name: Localized;
  technique: Recipe['technique'];
  glass: Recipe['glass'];
  ice: Recipe['ice'];
  difficulty: Recipe['difficulty'];
  ingredientIds: string[];
}

/**
 * Filters combine with AND; the values of one filter combine with OR.
 * A missing or empty filter matches everything.
 */
export interface RecipeQuery {
  q?: string;
  ingredient?: readonly string[];
  base?: readonly Base[];
  technique?: readonly Recipe['technique'][];
  glass?: readonly Recipe['glass'][];
  difficulty?: readonly Recipe['difficulty'][];
  family?: readonly Family[];
  /** Language used to sort by name. The text search covers both languages. */
  lang?: Language;
  /** 1-based. */
  page?: number;
  /** At most {@link MAX_PAGE_SIZE}. */
  limit?: number;
}

export interface RecipePage {
  items: RecipeSummary[];
  /** Matches before pagination. */
  total: number;
}

/** Lower case, without accents, with single spaces: "Piña  Colada" → "pina colada". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function summarizeRecipe(recipe: Recipe): RecipeSummary {
  return {
    id: recipe.id,
    family: recipe.family,
    base: recipe.base,
    name: recipe.name,
    technique: recipe.technique,
    glass: recipe.glass,
    ice: recipe.ice,
    difficulty: recipe.difficulty,
    ingredientIds: recipe.ingredients.map((line) => line.ingredientId),
  };
}

// Code-point order, so the result does not depend on the machine's locale.
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function oneOf<T>(allowed: readonly T[] | undefined, value: T): boolean {
  return allowed === undefined || allowed.length === 0 || allowed.includes(value);
}

/**
 * Searches recipes by name (either language, ignoring case and accents) and
 * filters them, sorted by name in `lang` and paginated. Pure: no I/O.
 */
export function searchRecipes(recipes: readonly Recipe[], query: RecipeQuery = {}): RecipePage {
  const text = normalizeText(query.q ?? '');
  const lang = query.lang ?? 'es';
  const limit = Math.min(Math.max(Math.trunc(query.limit ?? DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);
  const page = Math.max(Math.trunc(query.page ?? 1), 1);

  const matches = recipes.filter(
    (recipe) =>
      (text === '' ||
        normalizeText(recipe.name.es).includes(text) ||
        normalizeText(recipe.name.en).includes(text)) &&
      oneOf(query.base, recipe.base) &&
      oneOf(query.technique, recipe.technique) &&
      oneOf(query.glass, recipe.glass) &&
      oneOf(query.difficulty, recipe.difficulty) &&
      oneOf(query.family, recipe.family) &&
      (query.ingredient === undefined ||
        query.ingredient.length === 0 ||
        recipe.ingredients.some((line) => query.ingredient?.includes(line.ingredientId))),
  );

  matches.sort(
    (a, b) =>
      compare(normalizeText(a.name[lang]), normalizeText(b.name[lang])) || compare(a.id, b.id),
  );

  return {
    items: matches.slice((page - 1) * limit, page * limit).map(summarizeRecipe),
    total: matches.length,
  };
}
