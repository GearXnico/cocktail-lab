export const CITRUS = ['lime', 'lemon', 'orange'] as const;
export const CITRUS_CUTS = ['wheel', 'wedge', 'twist'] as const;

export type Citrus = (typeof CITRUS)[number];
export type CitrusCut = (typeof CITRUS_CUTS)[number];

export type GarnishKind =
  | `${Citrus}-${CitrusCut}`
  | 'cherry'
  | 'olive'
  | 'mint'
  | 'pineapple'
  | 'salt-rim'
  | 'bitters-drops'
  | 'spice-dusting';

export interface VisualHint {
  color: string;
  topColor?: string;
  cloudy?: boolean;
  foam?: string;
  layers?: { color: string; share: number }[];
  scoop?: string;
  garnish?: GarnishKind[];
  iceAfter?: number;
}

export type SolidKind = 'scoop' | 'sugar-cube' | 'sugar' | 'mint-leaves' | 'lime-wedges';

export interface IngredientHint {
  solid?: SolidKind;
  ml?: number;
}

export const fallbackHint: VisualHint = { color: '#d9c9a3' };

// Keyed by ingredient id. Without an entry, an ingredient is poured.
export const ingredientHints: Record<string, IngredientHint> = {
  'pineapple-ice-cream': { solid: 'scoop' },
  'sugar-cube': { solid: 'sugar-cube' },
  'superfine-sugar': { solid: 'sugar' },
  'mint-sprig': { solid: 'mint-leaves' },
  lime: { solid: 'lime-wedges' },
  'egg-white': { ml: 30 },
  'egg-yolk': { ml: 18 },
};

// iceAfter is the number of ingredient lines added before the ice, following
// the recipe's written steps; without it the ice goes in first.
export const visualHints: Record<string, VisualHint> = {
  'cuba-libre': { color: '#3a1a0d', garnish: ['lime-wedge'] },
  'john-collins': { color: '#eee9bd', cloudy: true, garnish: ['lemon-wheel', 'cherry'] },
  mojito: {
    color: '#cfdf9f',
    topColor: '#eef3dc',
    garnish: ['mint', 'lime-wheel'],
    iceAfter: 4,
  },
  'moscow-mule': { color: '#e6dcae', garnish: ['lime-wheel'] },
  paloma: { color: '#f4b3a2', cloudy: true, garnish: ['lime-wheel'], iceAfter: 2 },

  caipirinha: { color: '#dfe6b0', cloudy: true, iceAfter: 3 },
  'pantera-rosa': { color: '#f3a3b7', cloudy: true },
  'pisco-sour-chilean': { color: '#efe9b8', cloudy: true },
  'pisco-sour-peruvian': {
    color: '#ece5b4',
    cloudy: true,
    foam: '#fbf7e8',
    garnish: ['bitters-drops'],
  },
  terremoto: {
    color: '#e6cf7c',
    layers: [
      { color: '#a8152b', share: 0.14 },
      { color: '#e6cf7c', share: 0.86 },
    ],
    scoop: '#f6e9a6',
  },
  'vaina-chilena': {
    color: '#8f5234',
    cloudy: true,
    foam: '#c9a17c',
    garnish: ['spice-dusting'],
  },

  daiquiri: { color: '#ecefc8', cloudy: true },
  'last-word': { color: '#cddb96', cloudy: true },
  margarita: { color: '#e6ecbc', cloudy: true, garnish: ['salt-rim'] },
  sidecar: { color: '#e09a3c', cloudy: true },
  'whiskey-sour': { color: '#dd9a34', cloudy: true, garnish: ['orange-wheel', 'cherry'] },

  'aperol-spritz': { color: '#f2611c', topColor: '#f79a4a', garnish: ['orange-wheel'] },
  bellini: { color: '#f6b584', cloudy: true },
  'champagne-cocktail': { color: '#e6c062', garnish: ['orange-twist', 'cherry'] },
  'french-75': { color: '#ebe2a6', topColor: '#f4edc6' },
  mimosa: { color: '#f8a524', cloudy: true, garnish: ['orange-twist'] },

  'dry-martini': { color: '#eaf0e6', garnish: ['olive'] },
  manhattan: { color: '#8a2c18', garnish: ['cherry'] },
  negroni: { color: '#b3241a', garnish: ['orange-wheel'] },
  'old-fashioned': { color: '#b3611b', garnish: ['orange-twist', 'cherry'], iceAfter: 4 },
  sazerac: { color: '#bd5e1d', garnish: ['lemon-twist'] },

  'jungle-bird': { color: '#a5301c', cloudy: true, garnish: ['pineapple'] },
  'mai-tai': { color: '#c7772a', cloudy: true, garnish: ['pineapple', 'mint', 'lime-twist'] },
  'pina-colada': { color: '#f6f0d6', cloudy: true, garnish: ['pineapple', 'cherry'] },
  'planters-punch': { color: '#c36724', garnish: ['orange-twist'], iceAfter: 3 },
  zombie: { color: '#c0521d', cloudy: true, garnish: ['mint'] },
};
