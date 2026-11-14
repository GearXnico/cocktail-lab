import { Group, type Object3D } from 'three';
import type { Ice } from '../recipes';
import type { Vessel } from '../steps';
import { buildContainer, type Container } from './container';
import { buildIce } from './ice';
import { buildLiquid, type Band } from './liquid';
import type { Rng } from './random';
import { buildVessel, type VesselModel } from './vessels';

export interface Rig {
  object: Group;
  vessel: Container;
  spare: Container | null;
  lid: Object3D | null;
}

export interface RigOptions {
  color: string;
  cloudy: boolean;
  bands: Band[];
  ice: Ice;
  rng: Rng;
}

const SPARE_GAP = 1;

function station(
  kind: Vessel,
  leftEdge: number,
  options: RigOptions,
  bands: Band[],
  ice: Ice,
): { container: Container; parts: VesselModel } {
  const parts = buildVessel(kind);
  const { model } = parts;
  const iceTop = model.bottomY + (model.rimY - model.bottomY) * parts.iceFill;
  const liquid = buildLiquid(model, {
    layers: [{ color: options.color, share: 1 }],
    blend: 0,
    bands,
    cloudy: options.cloudy,
    foam: undefined,
  });
  const container = buildContainer(
    model,
    leftEdge + model.radius,
    liquid,
    buildIce(ice, { ...model, fillY: iceTop }, options.rng),
  );
  if (parts.lid) container.object.add(parts.lid);
  if (parts.stand) parts.stand.position.x = container.home.x;
  return { container, parts };
}

export function buildRig(kind: Vessel, leftEdge: number, options: RigOptions): Rig {
  // Shaking ice is always cubes; a blender takes the drink's own ice.
  const first = station(kind, leftEdge, options, options.bands, kind === 'blender' ? options.ice : 'cubes');
  const object = new Group();
  object.add(first.container.object);
  if (first.parts.stand) object.add(first.parts.stand);

  let spare: Container | null = null;
  if (kind === 'tins') {
    const edge = first.container.home.x + first.container.model.radius + SPARE_GAP;
    spare = station(kind, edge, options, [], 'none').container;
    object.add(spare.object);
  }
  return { object, vessel: first.container, spare, lid: first.parts.lid };
}
