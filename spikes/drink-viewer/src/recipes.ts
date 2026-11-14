export const GLASSES = [
  'coupe',
  'cocktail',
  'nick-and-nora',
  'rocks',
  'highball',
  'collins',
  'flute',
  'wine',
  'copper-mug',
  'tiki-mug',
] as const;

export const ICES = ['none', 'cubes', 'large-cube', 'crushed'] as const;

export type Glass = (typeof GLASSES)[number];
export type Ice = (typeof ICES)[number];
export type Technique = 'shake' | 'dry-shake' | 'stir' | 'build' | 'throw' | 'swizzle' | 'blend';

interface Localized {
  es: string;
  en: string;
}

// The spike sits outside the npm workspaces, so it mirrors the fields it reads
// from RecipeSchema (packages/core) instead of importing the package.
export interface Recipe {
  id: string;
  family: string;
  name: Localized;
  ingredients: { ingredientId: string; amount: number; unit: string; topUp?: boolean }[];
  technique: Technique;
  glass: Glass;
  ice: Ice;
  garnish?: Localized;
}

const files = import.meta.glob<Recipe>('../../../data/recipes/**/*.json', {
  eager: true,
  import: 'default',
});

export const recipes: readonly Recipe[] = Object.values(files).sort(
  (a, b) => a.family.localeCompare(b.family) || a.name.en.localeCompare(b.name.en),
);

const catalogue = import.meta.glob<{ id: string; name: Localized }[]>(
  '../../../data/ingredients.json',
  { eager: true, import: 'default' },
);

export const ingredientNames: ReadonlyMap<string, Localized> = new Map(
  Object.values(catalogue)
    .flat()
    .map((ingredient) => [ingredient.id, ingredient.name]),
);
