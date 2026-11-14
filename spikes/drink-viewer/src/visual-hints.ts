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
  color?: string;
  cloudy?: true;
  solid?: SolidKind;
  unitMl?: number;
}

export const fallbackHint: VisualHint = { color: '#d9c9a3' };

// Keyed by ingredient id; the colours are provisional. An ingredient is poured
// unless it has `solid`, and a clear one is as see-through as its colour is pale.
export const ingredientHints: Record<string, IngredientHint> = {
  'pineapple-ice-cream': { solid: 'scoop' },
  'sugar-cube': { solid: 'sugar-cube' },
  'superfine-sugar': { solid: 'sugar' },
  'mint-sprig': { solid: 'mint-leaves' },
  lime: { solid: 'lime-wedges' },
  'egg-white': { color: '#f3efd6', unitMl: 30 },
  'egg-yolk': { color: '#f2b632', cloudy: true, unitMl: 18 },

  vodka: { color: '#f6f8f9' },
  gin: { color: '#f5f8f8' },
  'white-rum': { color: '#f7f8f6' },
  'tequila-blanco': { color: '#f6f7f4' },
  cachaca: { color: '#f5f7f2' },
  'peruvian-pisco': { color: '#f6f7f3' },
  'chilean-pisco': { color: '#f3f1e2' },
  bourbon: { color: '#b5651d' },
  'rye-whiskey': { color: '#b86a22' },
  cognac: { color: '#a8501a' },
  'gold-puerto-rican-rum': { color: '#d39a3a' },
  'amber-jamaican-rum': { color: '#c07a28' },
  'jamaican-rum': { color: '#b06a24' },
  'martinique-molasses-rhum': { color: '#a85f1f' },
  'demerara-rum': { color: '#7a3a16' },
  'jamaican-dark-rum': { color: '#5c2a12' },
  'blackstrap-rum': { color: '#2a130a' },
  absinthe: { color: '#b9d36a' },

  'triple-sec': { color: '#f7f6ee' },
  'maraschino-liqueur': { color: '#f6f6f0' },
  'green-chartreuse': { color: '#a9c23f' },
  'orange-curacao': { color: '#e88a2a' },
  campari: { color: '#c8102e' },
  aperol: { color: '#f2611c' },
  pernod: { color: '#dfe38a' },
  'creme-de-cacao': { color: '#4a2a18' },

  'dry-vermouth': { color: '#ece6b4' },
  'sweet-vermouth': { color: '#6e1f14' },
  'port-wine': { color: '#5e1420' },
  'pipeno-wine': { color: '#e6cf7c' },
  prosecco: { color: '#f1e6a8' },
  champagne: { color: '#efdf9c' },

  'angostura-bitters': { color: '#5a1a0c' },
  'peychauds-bitters': { color: '#c2262e' },
  'sugar-syrup': { color: '#f3f1e4' },
  'demerara-syrup': { color: '#b9772e' },
  grenadine: { color: '#a8152b' },
  falernum: { color: '#efe9cf' },
  orgeat: { color: '#efe6d0', cloudy: true },

  'lime-juice': { color: '#dfe7a8', cloudy: true },
  'lemon-juice': { color: '#f1e9a0', cloudy: true },
  'orange-juice': { color: '#f8a524', cloudy: true },
  'pineapple-juice': { color: '#f3d86a', cloudy: true },
  'sugar-cane-juice': { color: '#d8d08a', cloudy: true },
  'white-peach-puree': { color: '#f6c39a', cloudy: true },
  'donns-mix': { color: '#e9b36a', cloudy: true },
  'coconut-cream': { color: '#fbf8ee', cloudy: true },
  'evaporated-milk': { color: '#f6efdc', cloudy: true },

  water: { color: '#f4f8fa' },
  'soda-water': { color: '#f2f7f8' },
  'ginger-beer': { color: '#e9dfae' },
  'pink-grapefruit-soda': { color: '#f6b6a6' },
  cola: { color: '#2e1508' },
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
