import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  RecipeIngredientSchema,
  SlugSchema,
  amountInMeasure,
  currencyDigits,
  drinkCost,
  priceDrink,
  unitCost,
} from '@cocktail-lab/core';
import type { Ingredient, IngredientPrice, RecipeIngredient } from '@cocktail-lab/core';
import type { Catalogue } from './catalogue.js';

/** The body is small by design: a recipe has a handful of lines. */
export const COSTING_BODY_LIMIT = 16 * 1024;
const MAX_LINES = 30;
const MAX_PRICES = 100;

const currencies = new Set(Intl.supportedValuesOf('currency'));

const PriceSchema = z.strictObject({
  ingredientId: SlugSchema,
  price: z.number().min(0).max(1e9),
  size: z.number().positive().max(1e9),
  measure: z.enum(['ml', 'unit', 'g']),
});

const CostingBodySchema = z
  .strictObject({
    recipeId: SlugSchema.optional(),
    ingredients: z.array(RecipeIngredientSchema).min(1).max(MAX_LINES).optional(),
    prices: z.array(PriceSchema).max(MAX_PRICES),
    wastePct: z.number().min(0).max(1),
    targetCostPct: z.number().gt(0).max(1),
    taxPct: z.number().min(0).max(1).optional(),
    taxIncluded: z.boolean().optional(),
    roundingStep: z.number().gt(0).max(1e6).optional(),
    currency: z.string().refine((code) => currencies.has(code), 'Not an ISO 4217 currency code'),
  })
  .refine((body) => (body.recipeId === undefined) !== (body.ingredients === undefined), {
    message: 'Send either recipeId or ingredients, not both and not neither',
  })
  .refine((body) => new Set(body.prices.map((price) => price.ingredientId)).size === body.prices.length, {
    message: 'Each ingredient can have only one price',
    path: ['prices'],
  });

const Money = z.number().nullable();

const CostingResponseSchema = z.object({
  lines: z.array(
    z.object({
      ingredientId: z.string(),
      amount: z.number(),
      unit: RecipeIngredientSchema.shape.unit,
      topUp: z.boolean().optional(),
      /** Cost of the line before waste; null when the ingredient has no usable price. */
      cost: Money,
    }),
  ),
  /** The money and percentage fields are null while `missing` is not empty: an incomplete cost is never zero. */
  drinkCost: Money,
  netPrice: Money,
  menuPrice: Money,
  margin: Money,
  marginPct: Money,
  costPct: Money,
  missing: z.array(z.string()),
});

const ErrorSchema = z.object({ error: z.string() });
/** `issues` is absent when the framework rejects the request, e.g. malformed JSON. */
const ValidationErrorSchema = z.object({
  error: z.string(),
  issues: z.array(z.object({ path: z.string(), code: z.string(), message: z.string() })).optional(),
});

function toLine(
  line: RecipeIngredient,
  ingredients: ReadonlyMap<string, Ingredient>,
  prices: ReadonlyMap<string, IngredientPrice>,
  digits: number,
) {
  const ingredient = ingredients.get(line.ingredientId);
  const price = prices.get(line.ingredientId);
  const cost =
    ingredient && price?.measure === ingredient.measure
      ? Number(
          (amountInMeasure(line.amount, line.unit, ingredient.measure) * unitCost(price.price, price.size)).toFixed(
            digits,
          ),
        )
      : null;
  return { ...line, cost };
}

/** Registers `POST /costing`: stateless, nothing from the body is stored or logged. */
export function registerCosting(api: FastifyInstance, catalogue: Catalogue): void {
  const route = api.withTypeProvider<ZodTypeProvider>();
  const ingredientsById = new Map(catalogue.ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const recipesById = new Map(catalogue.recipes.map((recipe) => [recipe.id, recipe]));

  route.post(
    '/costing',
    {
      bodyLimit: COSTING_BODY_LIMIT,
      schema: {
        body: CostingBodySchema,
        response: { 200: CostingResponseSchema, 400: ValidationErrorSchema, 404: ErrorSchema },
      },
    },
    async (request, reply) => {
      const body = request.body;
      let lines: readonly RecipeIngredient[];
      if (body.recipeId !== undefined) {
        const recipe = recipesById.get(body.recipeId);
        if (!recipe) return reply.code(404).send({ error: 'Recipe not found' });
        lines = recipe.ingredients;
      } else {
        lines = body.ingredients ?? [];
        const unknown = lines.findIndex((line) => !ingredientsById.has(line.ingredientId));
        if (unknown !== -1) {
          return reply.code(400).send({
            error: 'Bad Request',
            issues: [
              {
                path: `/ingredients/${String(unknown)}/ingredientId`,
                code: 'unknown_ingredient',
                message: 'Unknown ingredient',
              },
            ],
          });
        }
        const mismatch = lines.findIndex((line) => {
          const measure = ingredientsById.get(line.ingredientId)?.measure;
          return measure !== undefined && !fits(line, measure);
        });
        if (mismatch !== -1) {
          return reply.code(400).send({
            error: 'Bad Request',
            issues: [
              {
                path: `/ingredients/${String(mismatch)}/unit`,
                code: 'unit_mismatch',
                message: 'Unit does not fit how the ingredient is measured',
              },
            ],
          });
        }
      }

      const prices = new Map<string, IngredientPrice>(
        body.prices.map(({ ingredientId, ...price }) => [ingredientId, price]),
      );
      const digits = currencyDigits(body.currency);
      const costed = lines.map((line) => toLine(line, ingredientsById, prices, digits));

      const cost = drinkCost(
        lines,
        ingredientsById,
        Object.fromEntries(prices),
        body.wastePct,
        body.currency,
      );
      if (!cost.complete) {
        return {
          lines: costed,
          drinkCost: null,
          netPrice: null,
          menuPrice: null,
          margin: null,
          marginPct: null,
          costPct: null,
          missing: cost.missing,
        };
      }
      const pricing = priceDrink({
        drinkCost: cost.cost,
        targetCostPct: body.targetCostPct,
        currency: body.currency,
        ...(body.taxPct !== undefined && { taxPct: body.taxPct }),
        ...(body.taxIncluded !== undefined && { taxIncluded: body.taxIncluded }),
        ...(body.roundingStep !== undefined && { roundingStep: body.roundingStep }),
      });
      return { lines: costed, ...pricing, missing: [] };
    },
  );
}

/** Whether `amountInMeasure` accepts this line for the ingredient's measure. */
function fits(line: RecipeIngredient, measure: Ingredient['measure']): boolean {
  try {
    amountInMeasure(line.amount, line.unit, measure);
    return true;
  } catch {
    return false;
  }
}
