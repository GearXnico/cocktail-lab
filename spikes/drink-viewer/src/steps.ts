import type { Ice, Recipe, Technique } from './recipes';
import { ingredientHints, type SolidKind, type VisualHint } from './visual-hints';

export type Vessel = 'shaker' | 'mixing-glass' | 'blender' | 'tins';
export type Place = 'glass' | 'vessel';

export interface Look {
  color: string;
  opacity: number;
}

export type Step =
  | { kind: 'glass' | 'garnish' }
  | { kind: 'ice'; into: Place }
  | ({ kind: 'pour'; into: Place; line: number; from: number; to: number; thin: boolean } & Look)
  | { kind: 'solid'; into: Place; line: number; solid: SolidKind }
  | { kind: 'technique'; iced: boolean }
  | { kind: 'strain'; to: number };

interface Entry {
  line: Recipe['ingredients'][number];
  index: number;
}

export const VESSELS: Record<Technique, Vessel | null> = {
  shake: 'shaker',
  'dry-shake': 'shaker',
  stir: 'mixing-glass',
  blend: 'blender',
  throw: 'tins',
  build: null,
  swizzle: null,
};

const ML_PER_UNIT: Record<string, number> = { ml: 1, dash: 0.9, barspoon: 5 };
const THIN_BELOW_ML = 5;
const FALLBACK_COLOR = '#f0ece0';

const solidOf = ({ line }: Entry): SolidKind | undefined =>
  ingredientHints[line.ingredientId]?.solid;

function volume(entry: Entry): number {
  if (solidOf(entry)) return 0;
  const { ingredientId, amount, unit } = entry.line;
  return amount * (ingredientHints[ingredientId]?.unitMl ?? ML_PER_UNIT[unit] ?? 5);
}

const sum = (entries: Entry[]): number => entries.reduce((total, entry) => total + volume(entry), 0);

export function lookOf(ingredientId: string): Look {
  const hint = ingredientHints[ingredientId];
  const color = hint?.color ?? FALLBACK_COLOR;
  if (hint?.cloudy) return { color, opacity: 0.95 };
  const channels = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16) / 255);
  // A clear liquid is as see-through as its colour is close to water-white.
  const opacity = 0.12 + (1 - Math.min(...channels)) * 1.1;
  return { color, opacity: Math.min(Math.max(opacity, 0.12), 0.8) };
}

function adder(into: Place, entries: Entry[], start: number, span: number): Step[] {
  const total = sum(entries) || 1;
  let poured = 0;
  return entries.map((entry): Step => {
    const solid = solidOf(entry);
    if (solid) return { kind: 'solid', into, line: entry.index, solid };
    const from = start + (span * poured) / total;
    poured += volume(entry);
    return {
      kind: 'pour',
      into,
      line: entry.index,
      from,
      to: start + (span * poured) / total,
      thin: volume(entry) < THIN_BELOW_ML,
      ...lookOf(entry.line.ingredientId),
    };
  });
}

const when = (on: boolean, step: Step): Step[] => (on ? [step] : []);

export function planSteps(recipe: Recipe, hint: VisualHint, ice: Ice, technique: Technique): Step[] {
  const entries = recipe.ingredients.map((line, index) => ({ line, index }));
  const iced = ice !== 'none';
  const garnish = when(Boolean(recipe.garnish ?? hint.garnish?.length), { kind: 'garnish' });

  if (!VESSELS[technique]) {
    const adds = adder('glass', entries, 0, 1);
    if (iced) adds.splice(Math.min(hint.iceAfter ?? 0, adds.length), 0, { kind: 'ice', into: 'glass' });
    return [{ kind: 'glass' }, ...adds, { kind: 'technique', iced }, ...garnish];
  }

  // A top-up never goes through the shaker: it is poured over the strained drink.
  const mixed = entries.filter((entry) => !entry.line.topUp);
  const topUps = entries.filter((entry) => entry.line.topUp);
  const share = sum(mixed) / (sum(entries) || 1);
  const blended = technique === 'blend';
  return [
    { kind: 'glass' },
    ...adder('vessel', mixed, 0, 1),
    ...when(technique === 'dry-shake', { kind: 'technique', iced: false }),
    ...when(!blended || iced, { kind: 'ice', into: 'vessel' }),
    { kind: 'technique', iced: true },
    ...when(!blended && iced, { kind: 'ice', into: 'glass' }),
    { kind: 'strain', to: share },
    ...adder('glass', topUps, share, 1 - share),
    ...garnish,
  ];
}
