import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CatalogueError, loadCatalogue } from './catalogue.js';

const realData = join(import.meta.dirname, '..', '..', '..', 'data');
let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cocktail-lab-'));
  cpSync(realData, dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function errorsOf(): readonly string[] {
  try {
    loadCatalogue(dir);
  } catch (error) {
    if (error instanceof CatalogueError) return error.errors;
    throw error;
  }
  return [];
}

describe('loadCatalogue', () => {
  it('loads the real data', () => {
    const { ingredients, recipes } = loadCatalogue(dir);
    expect(ingredients.length).toBeGreaterThan(0);
    expect(recipes.length).toBeGreaterThan(0);
  });

  it('fails on a recipe that is not valid JSON', () => {
    writeFileSync(join(dir, 'recipes', 'sours', 'daiquiri.json'), '{ nope');
    expect(errorsOf().join('\n')).toContain('recipes/sours/daiquiri.json');
  });

  it('fails on a recipe that breaks the schema', () => {
    writeFileSync(join(dir, 'recipes', 'sours', 'daiquiri.json'), '{}');
    expect(errorsOf().some((error) => error.startsWith('recipes/sours/daiquiri.json: '))).toBe(true);
  });

  it('fails on rules that span files', () => {
    writeFileSync(join(dir, 'ingredients.json'), '[]');
    expect(errorsOf().join('\n')).toContain('unknown ingredient');
  });

  it('fails when the data folder is missing', () => {
    rmSync(join(dir, 'recipes'), { recursive: true });
    expect(errorsOf().length).toBeGreaterThan(0);
  });
});
