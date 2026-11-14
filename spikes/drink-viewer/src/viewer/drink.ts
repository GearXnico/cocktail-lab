import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import type { Glass, Ice, Recipe, Technique } from '../recipes';
import type { VisualHint } from '../visual-hints';
import { buildGarnish } from './garnish';
import { buildGlass, type GlassModel } from './glasses';
import { buildIce } from './ice';
import { buildLiquid, type LiquidLayer } from './liquid';
import { clamp, radiusAt } from './profile';
import { seeded } from './random';

export interface DrinkOptions {
  glass: Glass;
  ice: Ice;
}

export interface Drink {
  object: Group;
  height: number;
  radius: number;
  setStep(step: number, animate: boolean): void;
  update(dt: number): boolean;
}

type Motion = 'wobble' | 'stir';

const MOTIONS: Record<Technique, Motion> = {
  shake: 'wobble',
  'dry-shake': 'wobble',
  throw: 'wobble',
  blend: 'wobble',
  stir: 'stir',
  build: 'stir',
  swizzle: 'stir',
};

const DURATIONS = [0, 0.6, 1.8, 1.6, 0.5];

const easeOut = (k: number): number => 1 - (1 - k) ** 3;
const easeInOut = (k: number): number => k * k * (3 - 2 * k);

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

function barSpoon(glass: GlassModel): Group {
  const length = glass.rimY - glass.bottomY + 5;
  const reach = radiusAt(glass.cavity, glass.bottomY + 1) * 0.45;
  const material = new MeshStandardMaterial({ color: 0xd8dde2, metalness: 1, roughness: 0.25 });
  const shaft = new Mesh(new CylinderGeometry(0.07, 0.07, length, 6), material);
  shaft.position.y = length / 2;
  const bowl = new Mesh(new SphereGeometry(0.32, 10, 8), material);
  bowl.scale.set(1, 1.5, 0.4);
  const spoon = new Group();
  spoon.add(shaft, bowl);
  spoon.position.set(reach, glass.bottomY + 0.6, 0);
  spoon.rotation.z = Math.atan2(reach * 1.6, length);
  const pivot = new Group();
  pivot.add(spoon);
  return pivot;
}

export function buildDrink(recipe: Recipe, hint: VisualHint, options: DrinkOptions): Drink {
  const rng = seeded(recipe.id);
  const glass = buildGlass(options.glass);
  const liquid = buildLiquid(glass, {
    ...layersFor(recipe, hint),
    cloudy: hint.cloudy ?? false,
    foam: hint.foam,
    scoop: hint.scoop,
  });
  const ice = buildIce(options.ice, glass, rng);
  const garnish = buildGarnish(hint.garnish ?? [], {
    glass,
    surfaceY: liquid.surfaceY,
    hasIce: options.ice !== 'none',
    rng,
  });
  const spoon = barSpoon(glass);
  const motion = MOTIONS[recipe.technique];

  const object = new Group();
  object.add(glass.object, liquid.object, ice, garnish, spoon);

  let active: { step: number; elapsed: number; duration: number } | null = null;

  const rest = (step: number): void => {
    object.rotation.set(0, 0, 0);
    object.position.y = 0;
    ice.visible = step >= 1;
    ice.position.y = 0;
    ice.rotation.y = 0;
    liquid.setLevel(step >= 2 ? 1 : 0);
    spoon.visible = false;
    garnish.visible = step >= 4;
    garnish.position.y = 0;
  };

  const pose = (step: number, k: number): void => {
    if (step === 1) ice.position.y = (1 - easeOut(k)) * (glass.rimY - glass.bottomY + 3);
    else if (step === 2) liquid.setLevel(easeInOut(k));
    else if (step === 4) garnish.position.y = (1 - easeOut(k)) * 3;
    else if (step === 3 && motion === 'stir') {
      spoon.visible = true;
      spoon.rotation.y = easeInOut(k) * Math.PI * 6;
      ice.rotation.y = easeInOut(k) * Math.PI * 2;
    } else if (step === 3) {
      const envelope = Math.sin(Math.PI * k);
      const beat = k * Math.PI * 14;
      object.rotation.z = envelope * 0.08 * Math.sin(beat);
      object.rotation.x = envelope * 0.05 * Math.cos(beat);
      object.position.y = envelope * (0.3 + 0.25 * Math.abs(Math.sin(beat)));
    }
  };

  return {
    object,
    height: glass.rimY,
    radius: glass.radius,
    setStep(step, animate) {
      rest(step);
      const duration = step === 1 && options.ice === 'none' ? 0 : (DURATIONS[step] ?? 0);
      active = animate && duration > 0 ? { step, elapsed: 0, duration } : null;
      if (active) pose(step, 0);
    },
    update(dt) {
      if (!active) return false;
      active.elapsed += dt;
      const k = active.elapsed / active.duration;
      if (k < 1) pose(active.step, k);
      else {
        rest(active.step);
        active = null;
      }
      return true;
    },
  };
}
