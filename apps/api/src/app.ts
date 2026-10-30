import { STATUS_CODES } from 'node:http';
import Fastify from 'fastify';
import type { FastifyBaseLogger, FastifyError, FastifyInstance } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  BaseSchema,
  DEFAULT_PAGE_SIZE,
  FamilySchema,
  IngredientSchema,
  MAX_PAGE_SIZE,
  RecipeSchema,
  SlugSchema,
  searchRecipes,
} from '@cocktail-lab/core';
import type { RecipeQuery } from '@cocktail-lab/core';
import type { Catalogue } from './catalogue.js';
import { registerCosting } from './costing.js';

export const API_PREFIX = '/api/v1';

const ErrorSchema = z.object({ error: z.string() });
const ValidationErrorSchema = z.object({
  error: z.string(),
  issues: z.array(z.object({ path: z.string(), code: z.string(), message: z.string() })),
});

/** `?x=a&x=b` arrives as an array and `?x=a` as a string; both become an array. */
function many<T extends z.ZodType>(schema: T) {
  return z
    .union([schema, z.array(schema).max(20)])
    .transform((value): z.output<T>[] => (Array.isArray(value) ? value : [value]) as z.output<T>[]);
}

const DifficultyParam = z.enum(['1', '2', '3']).transform((value) => Number(value) as 1 | 2 | 3);

const ListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  ingredient: many(SlugSchema).optional(),
  base: many(BaseSchema).optional(),
  technique: many(RecipeSchema.shape.technique).optional(),
  glass: many(RecipeSchema.shape.glass).optional(),
  difficulty: many(DifficultyParam).optional(),
  family: many(FamilySchema).optional(),
  lang: z.enum(['es', 'en']).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

const RecipeSummarySchema = z.object({
  id: z.string(),
  family: FamilySchema,
  base: BaseSchema,
  name: RecipeSchema.shape.name,
  technique: RecipeSchema.shape.technique,
  glass: RecipeSchema.shape.glass,
  ice: RecipeSchema.shape.ice,
  difficulty: RecipeSchema.shape.difficulty,
  ingredientIds: z.array(z.string()),
});

export interface AppOptions {
  catalogue: Catalogue;
  /** Fastify's logger option; off by default so tests stay quiet. */
  logger?: boolean;
  /** A ready-made logger (Fastify 5 does not take an instance in `logger`); wins over `logger`. */
  loggerInstance?: FastifyBaseLogger;
}

/** Builds the API over an already validated catalogue. Nothing is listening yet. */
export function buildApp({ catalogue, logger = false, loggerInstance }: AppOptions): FastifyInstance {
  const app = Fastify({
    ...(loggerInstance ? { loggerInstance } : { logger }),
    bodyLimit: 64 * 1024,
  });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: 'Bad Request',
        issues: error.validation.map((issue) => ({
          path: issue.instancePath,
          code: issue.keyword,
          message: issue.message ?? 'Invalid value',
        })),
      });
    }
    // Framework errors such as a malformed or oversized body answer the standard
    // text of their status, never the error's own message.
    if (typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: STATUS_CODES[error.statusCode] ?? 'Bad Request' });
    }
    request.log.error({ err: error }, 'unhandled error');
    return reply.code(500).send({ error: 'Internal Server Error' });
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'Not Found' }));

  const recipesById = new Map(catalogue.recipes.map((recipe) => [recipe.id, recipe]));

  app.register(
    (api) => {
      const route = api.withTypeProvider<ZodTypeProvider>();

      route.get(
        '/health',
        { schema: { response: { 200: z.object({ status: z.literal('ok') }) } } },
        () => ({ status: 'ok' as const }),
      );

      route.get(
        '/recipes',
        {
          schema: {
            querystring: ListQuerySchema,
            response: {
              200: z.object({ items: z.array(RecipeSummarySchema), total: z.number() }),
              400: ValidationErrorSchema,
            },
          },
        },
        (request) => {
          const query: RecipeQuery = {};
          for (const [key, value] of Object.entries(request.query)) {
            if (value !== undefined) Object.assign(query, { [key]: value });
          }
          return searchRecipes(catalogue.recipes, query);
        },
      );

      route.get(
        '/recipes/:id',
        {
          schema: {
            params: z.object({ id: SlugSchema }),
            response: { 200: RecipeSchema, 400: ValidationErrorSchema, 404: ErrorSchema },
          },
        },
        async (request, reply) => {
          const recipe = recipesById.get(request.params.id);
          if (!recipe) return reply.code(404).send({ error: 'Recipe not found' });
          return recipe;
        },
      );

      route.get(
        '/ingredients',
        { schema: { response: { 200: z.array(IngredientSchema) } } },
        () => catalogue.ingredients,
      );

      registerCosting(api, catalogue);
    },
    { prefix: API_PREFIX },
  );

  return app;
}
