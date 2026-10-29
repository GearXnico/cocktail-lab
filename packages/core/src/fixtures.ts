import type { Ingredient, Recipe } from './schemas.js';

export const validIngredient: Ingredient = {
  id: 'lime-juice',
  name: { es: 'Jugo de lima', en: 'Lime juice' },
  category: 'juice',
  measure: 'ml',
};

export const validRecipe: Recipe = {
  schemaVersion: 1,
  id: 'daiquiri',
  family: 'sours',
  base: 'rum',
  name: { es: 'Daiquiri', en: 'Daiquiri' },
  ingredients: [
    { ingredientId: 'white-rum', amount: 60, unit: 'ml' },
    { ingredientId: 'lime-juice', amount: 20, unit: 'ml' },
  ],
  technique: 'shake',
  glass: 'cocktail',
  ice: 'none',
  steps: { es: ['Agitar.'], en: ['Shake.'] },
  difficulty: 1,
  history: { es: 'Historia.', en: 'History.' },
};
