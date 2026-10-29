import { z } from 'zod';

const text = z.string().trim().min(1);

export const LocalizedSchema = z.object({ es: text, en: text }).strict();

export const SlugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const BASES = [
  'gin',
  'rum',
  'tequila',
  'mezcal',
  'pisco',
  'whisky',
  'vodka',
  'cachaca',
  'brandy',
  'sparkling-wine',
  'wine',
  'beer',
  'aperitif',
] as const;

export const FAMILIES = [
  'sours',
  'spirit-forward',
  'highballs-collins',
  'sparkling-spritz',
  'tiki-tropical',
  'latin-american',
] as const;

export const BaseSchema = z.enum(BASES);
export const FamilySchema = z.enum(FAMILIES);

export const IngredientSchema = z
  .object({
    id: SlugSchema,
    name: LocalizedSchema,
    category: z.enum([
      'spirit',
      'liqueur',
      'wine',
      'syrup',
      'juice',
      'bitters',
      'soda',
      'fresh',
      'other',
    ]),
    base: BaseSchema.optional(),
    measure: z.enum(['ml', 'unit', 'g']),
  })
  .strict();

export const RecipeIngredientSchema = z
  .object({
    ingredientId: SlugSchema,
    amount: z.number().positive(),
    unit: z.enum(['ml', 'dash', 'barspoon', 'unit', 'g']),
    topUp: z.boolean().optional(),
  })
  .strict();

const stepList = z.array(text).min(1);

export const RecipeSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: SlugSchema,
    family: FamilySchema,
    base: BaseSchema,
    name: LocalizedSchema,
    ingredients: z.array(RecipeIngredientSchema).min(1),
    technique: z.enum([
      'shake',
      'dry-shake',
      'stir',
      'build',
      'throw',
      'swizzle',
      'blend',
    ]),
    glass: z.enum([
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
    ]),
    ice: z.enum(['none', 'cubes', 'large-cube', 'crushed']),
    garnish: LocalizedSchema.optional(),
    steps: z.object({ es: stepList, en: stepList }).strict(),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    history: LocalizedSchema,
    sources: z.array(z.url()).optional(),
  })
  .strict();

export type Localized = z.infer<typeof LocalizedSchema>;
export type Base = z.infer<typeof BaseSchema>;
export type Family = z.infer<typeof FamilySchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
