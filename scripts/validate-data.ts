import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { IngredientsFileSchema, RecipeSchema, validateCatalogue } from '@cocktail-lab/core';
import type { Ingredient, RecipeEntry } from '@cocktail-lab/core';

const root = join(import.meta.dirname, '..');
const dataDir = join(root, 'data');
const release = process.argv.includes('--release');

interface Schema<T> {
  safeParse(data: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
}

const errors: string[] = [];

function readJson(file: string): unknown {
  const name = relative(root, file).replaceAll('\\', '/');
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as unknown;
  } catch (error) {
    errors.push(`${name}: ${error instanceof Error ? error.message : 'cannot be read as JSON'}`);
    return undefined;
  }
}

function parse<T>(file: string, schema: Schema<T>): T | undefined {
  const json = readJson(file);
  if (json === undefined) return undefined;
  const result = schema.safeParse(json);
  if (result.success) return result.data;
  const name = relative(root, file).replaceAll('\\', '/');
  for (const issue of result.error.issues) {
    errors.push(`${name}: ${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`);
  }
  return undefined;
}

const ingredients: Ingredient[] =
  parse(join(dataDir, 'ingredients.json'), IngredientsFileSchema) ?? [];

const entries: RecipeEntry[] = [];
const recipesDir = join(dataDir, 'recipes');
for (const folder of readdirSync(recipesDir, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  for (const file of readdirSync(join(recipesDir, folder.name))) {
    if (!file.endsWith('.json')) continue;
    const recipe = parse(join(recipesDir, folder.name, file), RecipeSchema);
    if (recipe) entries.push({ folder: folder.name, slug: file.slice(0, -'.json'.length), recipe });
  }
}

const report = validateCatalogue(ingredients, entries, { release });
errors.push(...report.errors);

for (const warning of report.warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);

console.log(
  `${String(ingredients.length)} ingredients, ${String(entries.length)} recipes, ` +
    `${String(errors.length)} errors, ${String(report.warnings.length)} warnings` +
    (release ? ' (release mode)' : ''),
);
process.exitCode = errors.length > 0 ? 1 : 0;
