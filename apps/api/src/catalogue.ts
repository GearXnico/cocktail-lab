import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IngredientsFileSchema, RecipeSchema, validateCatalogue } from '@cocktail-lab/core';
import type { Ingredient, Recipe, RecipeEntry } from '@cocktail-lab/core';

export interface Catalogue {
  ingredients: Ingredient[];
  recipes: Recipe[];
}

/** Thrown when `data/` is unreadable or invalid; `errors` lists every problem. */
export class CatalogueError extends Error {
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(`Invalid catalogue:\n${errors.map((error) => `- ${error}`).join('\n')}`);
    this.name = 'CatalogueError';
    this.errors = errors;
  }
}

interface Schema<T> {
  safeParse(data: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
}

/**
 * Reads and validates `<dataDir>/ingredients.json` and
 * `<dataDir>/recipes/<family>/<id>.json` with the same rules as
 * `npm run validate-data`. Throws {@link CatalogueError} on any error.
 */
export function loadCatalogue(dataDir: string): Catalogue {
  const errors: string[] = [];

  function parse<T>(file: string, name: string, schema: Schema<T>): T | undefined {
    let json: unknown;
    try {
      json = JSON.parse(readFileSync(file, 'utf8')) as unknown;
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : 'cannot be read as JSON'}`);
      return undefined;
    }
    const result = schema.safeParse(json);
    if (result.success) return result.data;
    for (const issue of result.error.issues) {
      errors.push(`${name}: ${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`);
    }
    return undefined;
  }

  const ingredients = parse(
    join(dataDir, 'ingredients.json'),
    'ingredients.json',
    IngredientsFileSchema,
  );

  const entries: RecipeEntry[] = [];
  try {
    const recipesDir = join(dataDir, 'recipes');
    for (const folder of readdirSync(recipesDir, { withFileTypes: true })) {
      if (!folder.isDirectory()) continue;
      for (const file of readdirSync(join(recipesDir, folder.name))) {
        if (!file.endsWith('.json')) continue;
        const recipe = parse(
          join(recipesDir, folder.name, file),
          `recipes/${folder.name}/${file}`,
          RecipeSchema,
        );
        if (recipe) {
          entries.push({ folder: folder.name, slug: file.slice(0, -'.json'.length), recipe });
        }
      }
    }
  } catch (error) {
    errors.push(`recipes: ${error instanceof Error ? error.message : 'cannot be read'}`);
  }

  if (ingredients) errors.push(...validateCatalogue(ingredients, entries).errors);
  if (errors.length > 0 || !ingredients) throw new CatalogueError(errors);

  return { ingredients, recipes: entries.map(({ recipe }) => recipe) };
}
