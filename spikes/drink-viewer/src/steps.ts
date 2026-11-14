import type { Ice, Recipe } from './recipes';
import { ingredientHints, type SolidKind, type VisualHint } from './visual-hints';

export type Step =
  | { kind: 'glass' | 'ice' | 'technique' | 'garnish' }
  | { kind: 'pour'; line: number; from: number; to: number; thin: boolean }
  | { kind: 'solid'; line: number; solid: SolidKind };

type Line = Recipe['ingredients'][number];

const ML_PER_UNIT: Record<string, number> = { ml: 1, dash: 0.9, barspoon: 5 };
const THIN_BELOW_ML = 5;

const solidOf = (line: Line): SolidKind | undefined => ingredientHints[line.ingredientId]?.solid;

function volume(line: Line): number {
  if (solidOf(line)) return 0;
  return line.amount * (ingredientHints[line.ingredientId]?.ml ?? ML_PER_UNIT[line.unit] ?? 5);
}

export function planSteps(recipe: Recipe, hint: VisualHint, ice: Ice): Step[] {
  const lines = recipe.ingredients;
  const total = lines.reduce((sum, line) => sum + volume(line), 0) || 1;
  const iceAt = ice === 'none' ? -1 : Math.min(hint.iceAfter ?? 0, lines.length);
  const steps: Step[] = [{ kind: 'glass' }];
  let poured = 0;
  lines.forEach((line, i) => {
    if (i === iceAt) steps.push({ kind: 'ice' });
    const solid = solidOf(line);
    if (solid) {
      steps.push({ kind: 'solid', line: i, solid });
      return;
    }
    const from = poured / total;
    poured += volume(line);
    steps.push({
      kind: 'pour',
      line: i,
      from,
      to: poured / total,
      thin: volume(line) < THIN_BELOW_ML,
    });
  });
  if (iceAt === lines.length) steps.push({ kind: 'ice' });
  steps.push({ kind: 'technique' });
  if (recipe.garnish ?? hint.garnish?.length) steps.push({ kind: 'garnish' });
  return steps;
}
