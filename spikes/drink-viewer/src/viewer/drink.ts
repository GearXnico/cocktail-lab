import { Group } from 'three';
import type { Glass, Ice, Recipe, Technique } from '../recipes';
import { VESSELS, type Place, type Step } from '../steps';
import type { VisualHint } from '../visual-hints';
import { buildContainer, type Container } from './container';
import { buildGarnish } from './garnish';
import { buildGlass } from './glasses';
import { buildIce } from './ice';
import { buildLiquid, type Band, type LiquidLayer } from './liquid';
import { easeInOut, easeOut, fall } from './motion';
import { clamp } from './profile';
import { buildStream } from './props';
import { seeded } from './random';
import { buildRig } from './rig';
import { buildSolid } from './solids';
import { blend, shake, stir } from './techniques';
import { reachTop, transfer } from './transfer';

export interface DrinkOptions {
  glass: Glass;
  ice: Ice;
  technique: Technique;
  steps: readonly Step[];
  staged: boolean;
}

export interface Drink {
  object: Group;
  height: number;
  radius: number;
  centerX: number;
  shadowRadius: number;
  setStep(index: number, animate: boolean): void;
  update(dt: number): boolean;
}

interface Fill {
  level: number;
  ice: boolean;
  mix: number;
}

interface State {
  glass: Fill;
  vessel: Fill;
  mixed: boolean;
  served: boolean;
  garnish: boolean;
}

type Pour = Extract<Step, { kind: 'pour' }>;

const SECONDS = { ice: 1.3, pour: 1.8, thinPour: 1, solid: 0.9, garnish: 0.5, strain: 3.2 };
const TECHNIQUE_SECONDS = { shaker: 2.2, 'mixing-glass': 1.8, blender: 2.2, tins: 5, glass: 1.6 };
const SETTLE_SECONDS = 0.6;
const SPOUT_ABOVE_RIM = 3.2;
const STREAM_TRAVEL = 0.14;
const VESSEL_GAP = 1.5;
const THROW_DROP = 5;

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
  const vesselKind = VESSELS[options.technique];
  const cloudy = hint.cloudy ?? false;
  const bandsInto = (place: Place): Band[] =>
    steps.flatMap((step) => (step.kind === 'pour' && step.into === place ? [step] : []));

  const glassModel = buildGlass(options.glass);
  // A strained drink arrives mixed, so only a drink built in the glass shows its pours.
  const glass = buildContainer(
    glassModel,
    0,
    buildLiquid(glassModel, {
      ...layersFor(recipe, hint),
      bands: vesselKind ? [] : bandsInto('glass'),
      cloudy,
      foam: hint.foam,
    }),
    buildIce(options.ice, glassModel, rng),
  );
  const garnish = buildGarnish(hint.garnish ?? [], {
    glass: glassModel,
    surfaceY: glass.liquid.surfaceY,
    hasIce: options.ice !== 'none',
    rng,
  });
  const stream = buildStream();
  const object = new Group();
  object.add(glass.object, garnish, stream.object);

  // The vessel is only part of the step mode; the finished drink stands alone.
  const rig =
    options.staged && vesselKind
      ? buildRig(vesselKind, glassModel.radius + VESSEL_GAP, {
          color: hint.color,
          cloudy,
          bands: bandsInto('vessel'),
          ice: options.ice,
          rng: seeded(`${recipe.id}:vessel`),
        })
      : null;
  if (rig) object.add(rig.object);
  const vessel = rig?.vessel ?? null;
  const spare = rig?.spare ?? null;
  const lid = rig?.lid ?? null;

  steps.forEach((step, index) => {
    if (step.kind !== 'solid') return;
    const into = step.into === 'vessel' ? vessel : glass;
    if (!into) return;
    const solid = buildSolid(step.solid, into.model, hint.scoop, rng);
    into.solids.set(index, solid);
    into.object.add(solid.object);
  });

  const states: State[] = [];
  let state: State = {
    glass: { level: 0, ice: false, mix: vesselKind ? 1 : 0 },
    vessel: { level: 0, ice: false, mix: 0 },
    mixed: false,
    served: false,
    garnish: false,
  };
  for (const step of steps) {
    state = { ...state, glass: { ...state.glass }, vessel: { ...state.vessel } };
    if (step.kind === 'ice') state[step.into].ice = true;
    else if (step.kind === 'pour') state[step.into].level = step.to;
    else if (step.kind === 'garnish') state.garnish = true;
    else if (step.kind === 'technique') {
      state[vesselKind ? 'vessel' : 'glass'].mix = 1;
      state.mixed = true;
      state.served ||= !vesselKind;
      if (vesselKind === 'blender') state.vessel.ice = false;
    } else if (step.kind === 'strain') {
      state.vessel.level = 0;
      state.glass.level = step.to;
      state.served = true;
      if (vesselKind === 'blender') state.glass.ice = options.ice !== 'none';
    }
    states.push(state);
  }
  const final = state;
  const stateAt = (index: number): State => states[clamp(index, 0, states.length - 1)] ?? final;
  const foamAt = (index: number): boolean => {
    const at = stateAt(index);
    return at.served && at.glass.level >= final.glass.level - 1e-6;
  };
  const where = (place: Place): Container => (place === 'vessel' && vessel ? vessel : glass);
  const layered = hint.layers !== undefined;

  const rest = (index: number): void => {
    const now = stateAt(index);
    const apply = (container: Container, fill: Fill): void => {
      container.reset();
      container.ice.object.visible = fill.ice;
      container.liquid.setMix(fill.mix);
      container.solids.forEach((solid, at) => {
        solid.object.visible = index >= at && !(solid.dissolves && now.mixed);
        solid.object.scale.setScalar(1);
      });
      container.setLevel(fill.level);
    };
    apply(glass, now.glass);
    if (vessel) apply(vessel, now.vessel);
    if (spare) apply(spare, { level: 0, ice: false, mix: 1 });
    if (rig) rig.object.visible = index >= 1;
    if (lid) lid.visible = false;
    glass.liquid.setFoam(foamAt(index) ? 1 : 0);
    stream.hide();
    garnish.visible = now.garnish;
    garnish.position.y = 0;
  };

  const pour = (step: Pour, k: number): void => {
    const into = where(step.into);
    const rise = easeInOut(clamp((k - STREAM_TRAVEL) / (1 - 2 * STREAM_TRAVEL), 0, 1));
    const level = step.from + (step.to - step.from) * rise;
    into.setLevel(level);
    const spout = into.model.rimY + SPOUT_ABOVE_RIM;
    let landing = into.liquid.levelY(level);
    for (const solid of into.solids.values()) {
      if (solid.object.visible) landing = Math.max(landing, solid.topY());
    }
    const reach = spout - landing;
    const head = clamp(k / STREAM_TRAVEL, 0, 1);
    const tail = clamp((k - (1 - STREAM_TRAVEL)) / STREAM_TRAVEL, 0, 1);
    stream.set(into.home.x, spout - reach * tail, spout - reach * head, step, step.thin);
  };

  const technique = (index: number, k: number): void => {
    const before = stateAt(index - 1);
    const mixer = vessel ?? glass;
    if (!before.mixed) {
      for (const solid of mixer.solids.values()) {
        if (!solid.dissolves) continue;
        solid.object.visible = true;
        solid.object.scale.setScalar(1 - k);
      }
    }
    mixer.liquid.setMix(Math.max(k, vessel ? before.vessel.mix : before.glass.mix));
    if (!vessel) {
      if (foamAt(index)) glass.liquid.setFoam(easeOut(k));
      if (!layered) stir(glass, k);
    } else if (vesselKind === 'shaker') shake(vessel, lid, k);
    else if (vesselKind === 'mixing-glass') stir(vessel, k);
    else if (vesselKind === 'blender') blend(vessel, lid, k);
    else if (spare) {
      const level = before.vessel.level;
      if (k < 0.5) {
        transfer(vessel, spare, stream, k * 2, {
          from: 0,
          to: 1,
          sourceFrom: level,
          sourceTo: 0,
          drop: THROW_DROP,
        });
      } else {
        transfer(spare, vessel, stream, k * 2 - 1, {
          from: 0,
          to: level,
          sourceFrom: 1,
          sourceTo: 0,
          drop: 0,
        });
      }
    }
  };

  const strain = (index: number, to: number, k: number): void => {
    if (!vessel) return;
    const before = stateAt(index - 1);
    const poured = transfer(vessel, glass, stream, k, {
      from: before.glass.level,
      to,
      sourceFrom: before.vessel.level,
      sourceTo: 0,
      drop: 0,
    });
    if (vesselKind === 'blender') glass.ice.setDrop(poured);
    glass.liquid.setFoam(foamAt(index) ? clamp((k - 0.8) / 0.2, 0, 1) : 0);
  };

  const pose = (index: number, k: number): void => {
    const step = steps[index];
    if (!step) return;
    if (step.kind === 'ice') where(step.into).ice.setDrop(k);
    else if (step.kind === 'pour') pour(step, k);
    else if (step.kind === 'solid') {
      const into = where(step.into);
      const surface = into.liquid.levelY(stateAt(index)[step.into].level);
      const dropHeight = into.model.rimY - into.model.bottomY + 2;
      into.solids.get(index)?.settle(surface, fall(k, dropHeight, 0.25));
    } else if (step.kind === 'technique') technique(index, k);
    else if (step.kind === 'strain') strain(index, step.to, k);
    else if (step.kind === 'garnish') garnish.position.y = (1 - easeOut(k)) * 3;
  };

  const durationOf = (step: Step): number => {
    if (step.kind === 'glass') return 0;
    if (step.kind === 'pour') return step.thin ? SECONDS.thinPour : SECONDS.pour;
    if (step.kind !== 'technique') return SECONDS[step.kind];
    if (vesselKind) return TECHNIQUE_SECONDS[vesselKind];
    return layered ? SETTLE_SECONDS : TECHNIQUE_SECONDS.glass;
  };

  const right = (spare ?? vessel)?.home.x ?? 0;
  const edge = right + ((spare ?? vessel)?.model.radius ?? glassModel.radius);
  const top = vessel
    ? Math.max(
        reachTop(vessel.model, glassModel, 0),
        spare ? reachTop(vessel.model, spare.model, THROW_DROP) : 0,
      )
    : glassModel.rimY + 4;

  let active: { index: number; elapsed: number; duration: number } | null = null;

  return {
    object,
    height: top - 4,
    radius: (edge + glassModel.radius) / 2,
    centerX: (edge - glassModel.radius) / 2,
    shadowRadius: glassModel.radius,
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
