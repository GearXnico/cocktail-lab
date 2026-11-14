import { Group } from 'three';
import type { Glass, Ice, Recipe, Technique } from '../recipes';
import type { Step } from '../steps';
import type { VisualHint } from '../visual-hints';
import { buildGarnish } from './garnish';
import { buildGlass } from './glasses';
import { buildIce } from './ice';
import { buildLiquid, type LiquidLayer } from './liquid';
import { easeInOut, easeOut, fall } from './motion';
import { clamp } from './profile';
import { barSpoon, buildStream } from './props';
import { seeded } from './random';
import { buildSolid } from './solids';

export interface DrinkOptions {
  glass: Glass;
  ice: Ice;
  steps: readonly Step[];
}

export interface Drink {
  object: Group;
  height: number;
  radius: number;
  setStep(index: number, animate: boolean): void;
  update(dt: number): boolean;
}

type Motion = 'wobble' | 'stir';
type Pour = Extract<Step, { kind: 'pour' }>;

const MOTIONS: Record<Technique, Motion> = {
  shake: 'wobble',
  'dry-shake': 'wobble',
  throw: 'wobble',
  blend: 'wobble',
  stir: 'stir',
  build: 'stir',
  swizzle: 'stir',
};

const DURATIONS: Record<Step['kind'], number> = {
  glass: 0,
  ice: 1.3,
  pour: 1.8,
  solid: 0.9,
  technique: 1.6,
  garnish: 0.5,
};
const THIN_POUR_DURATION = 1;
const SPOUT_ABOVE_RIM = 3.2;
const STREAM_TRAVEL = 0.14;

function layersFor(recipe: Recipe, hint: VisualHint): { layers: LiquidLayer[]; blend: number } {
  if (hint.layers) return { layers: hint.layers, blend: 0.05 };
  const ml = recipe.ingredients.filter((line) => line.unit === 'ml');
  const total = ml.reduce((sum, line) => sum + line.amount, 0);
  const topUp = ml.filter((line) => line.topUp).reduce((sum, line) => sum + line.amount, 0);
  if (!hint.topColor || topUp === 0) return { layers: [{ color: hint.color, share: 1 }], blend: 0 };
  const share = clamp(topUp / total, 0.2, 0.6);
  return {
    layers: [
      { color: hint.color, share: 1 - share },
      { color: hint.topColor, share },
    ],
    blend: 0.18,
  };
}

export function buildDrink(recipe: Recipe, hint: VisualHint, options: DrinkOptions): Drink {
  const { steps } = options;
  const rng = seeded(recipe.id);
  const glass = buildGlass(options.glass);
  const liquid = buildLiquid(glass, {
    ...layersFor(recipe, hint),
    cloudy: hint.cloudy ?? false,
    foam: hint.foam,
  });
  const ice = buildIce(options.ice, glass, rng);
  const garnish = buildGarnish(hint.garnish ?? [], {
    glass,
    surfaceY: liquid.surfaceY,
    hasIce: options.ice !== 'none',
    rng,
  });
  const solids = steps.map((step) =>
    step.kind === 'solid' ? buildSolid(step.solid, glass, hint.scoop, rng) : null,
  );
  const spoon = barSpoon(glass);
  const stream = buildStream();
  // Stirring would mix the layers the hint asks for.
  const motion = hint.layers ? null : MOTIONS[recipe.technique];

  const object = new Group();
  object.add(glass.object, liquid.object, ice.object, garnish, spoon, stream.object);
  for (const solid of solids) if (solid) object.add(solid.object);

  const first = (kind: Step['kind']): number => {
    const index = steps.findIndex((step) => step.kind === kind);
    return index < 0 ? Infinity : index;
  };
  const iceAt = first('ice');
  const techniqueAt = first('technique');
  const garnishAt = first('garnish');
  const dropHeight = glass.rimY - glass.bottomY + 2;

  const levels: number[] = [];
  let reached = 0;
  for (const step of steps) {
    if (step.kind === 'pour') reached = step.to;
    levels.push(reached);
  }
  const levelAfter = (index: number): number => levels[index] ?? reached;

  const setLevel = (level: number): void => {
    liquid.setLevel(level);
    const surface = liquid.levelY(level);
    for (const solid of solids) solid?.settle(surface, 0);
  };

  const rest = (index: number): void => {
    object.rotation.set(0, 0, 0);
    object.position.y = 0;
    ice.object.visible = index >= iceAt;
    ice.setDrop(1);
    ice.object.rotation.y = 0;
    solids.forEach((solid, at) => {
      if (!solid) return;
      solid.object.visible = index >= at && !(solid.dissolves && index >= techniqueAt);
      solid.object.scale.setScalar(1);
    });
    setLevel(levelAfter(index));
    liquid.setFoam(index >= techniqueAt ? 1 : 0);
    stream.hide();
    spoon.visible = false;
    garnish.visible = index >= garnishAt;
    garnish.position.y = 0;
  };

  const pour = (step: Pour, k: number): void => {
    const rise = easeInOut(clamp((k - STREAM_TRAVEL) / (1 - 2 * STREAM_TRAVEL), 0, 1));
    const level = step.from + (step.to - step.from) * rise;
    setLevel(level);
    const spout = glass.rimY + SPOUT_ABOVE_RIM;
    let landing = liquid.levelY(level);
    for (const solid of solids) {
      if (solid?.object.visible) landing = Math.max(landing, solid.topY());
    }
    const reach = spout - landing;
    const head = clamp(k / STREAM_TRAVEL, 0, 1);
    const tail = clamp((k - (1 - STREAM_TRAVEL)) / STREAM_TRAVEL, 0, 1);
    stream.set(
      spout - reach * tail,
      spout - reach * head,
      liquid.colorAt((step.from + step.to) / 2),
      step.thin,
    );
  };

  const technique = (k: number): void => {
    for (const solid of solids) {
      if (!solid?.dissolves) continue;
      solid.object.visible = true;
      solid.object.scale.setScalar(1 - k);
    }
    liquid.setFoam(easeOut(k));
    if (motion === 'stir') {
      spoon.visible = true;
      spoon.rotation.y = easeInOut(k) * Math.PI * 6;
      ice.object.rotation.y = easeInOut(k) * Math.PI * 2;
    } else if (motion === 'wobble') {
      const envelope = Math.sin(Math.PI * k);
      const beat = k * Math.PI * 14;
      object.rotation.z = envelope * 0.08 * Math.sin(beat);
      object.rotation.x = envelope * 0.05 * Math.cos(beat);
      object.position.y = envelope * (0.3 + 0.25 * Math.abs(Math.sin(beat)));
    }
  };

  const pose = (index: number, k: number): void => {
    const step = steps[index];
    if (!step) return;
    if (step.kind === 'ice') ice.setDrop(k);
    else if (step.kind === 'pour') pour(step, k);
    else if (step.kind === 'solid') {
      solids[index]?.settle(liquid.levelY(levelAfter(index)), fall(k, dropHeight, 0.25));
    } else if (step.kind === 'technique') technique(k);
    else if (step.kind === 'garnish') garnish.position.y = (1 - easeOut(k)) * 3;
  };

  const durationOf = (step: Step): number => {
    if (step.kind === 'pour' && step.thin) return THIN_POUR_DURATION;
    if (step.kind !== 'technique') return DURATIONS[step.kind];
    const changes = motion !== null || hint.foam !== undefined || solids.some((s) => s?.dissolves);
    return changes ? DURATIONS.technique : 0;
  };

  let active: { index: number; elapsed: number; duration: number } | null = null;

  return {
    object,
    height: glass.rimY,
    radius: glass.radius,
    setStep(index, animate) {
      rest(index);
      const step = steps[index];
      const duration = step ? durationOf(step) : 0;
      active = animate && duration > 0 ? { index, elapsed: 0, duration } : null;
      if (active) pose(index, 0);
    },
    update(dt) {
      if (!active) return false;
      active.elapsed += dt;
      const k = active.elapsed / active.duration;
      if (k < 1) pose(active.index, k);
      else {
        rest(active.index);
        active = null;
      }
      return true;
    },
  };
}
