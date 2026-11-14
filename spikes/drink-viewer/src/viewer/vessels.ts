import { CylinderGeometry, Mesh, MeshStandardMaterial, type Object3D } from 'three';
import type { Vessel } from '../steps';
import { buildShell, type GlassModel, type GlassSpec } from './glasses';

export interface VesselModel {
  model: GlassModel;
  lid: Object3D | null;
  stand: Object3D | null;
  iceFill: number;
}

const JAR_BASE = 4.5;

const TIN: GlassSpec = {
  foot: [[0, 0], [3.1, 0]],
  cavity: [[0, 0.3], [3, 0.3], [4.3, 17]],
  wall: 0.12,
  fill: 0.4,
  shell: 'steel',
};

const SMALL_TIN: GlassSpec = {
  foot: [[0, 0], [2.9, 0]],
  cavity: [[0, 0.3], [2.8, 0.3], [3.95, 12.5]],
  wall: 0.12,
  fill: 0.4,
  shell: 'steel',
};

const MIXING_GLASS: GlassSpec = {
  foot: [[0, 0], [4.2, 0]],
  cavity: [[0, 1.2], [4, 1.2], [4.4, 14.5]],
  wall: 0.25,
  fill: 0.4,
  shell: 'glass',
};

const JAR: GlassSpec = {
  foot: [[0, JAR_BASE], [2.7, JAR_BASE]],
  cavity: [[0, JAR_BASE + 0.5], [2.5, JAR_BASE + 0.5], [3.2, JAR_BASE + 5], [4.4, JAR_BASE + 15]],
  handle: true,
  wall: 0.2,
  fill: 0.45,
  shell: 'glass',
};

const darkPlastic = (): MeshStandardMaterial =>
  new MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.5 });

function shaker(): VesselModel {
  const model = buildShell(TIN);
  const lid = buildShell(SMALL_TIN).object;
  lid.rotation.z = Math.PI;
  lid.position.y = model.rimY + 10;
  return { model, lid, stand: null, iceFill: 0.7 };
}

function blender(): VesselModel {
  const model = buildShell(JAR);
  // The lathe is symmetric, so turning it only moves the handle away from the glass.
  model.object.rotation.y = Math.PI;
  const lid = new Mesh(new CylinderGeometry(4.75, 4.75, 0.7, 40), darkPlastic());
  lid.position.y = model.rimY + 0.3;
  const stand = new Mesh(new CylinderGeometry(3.6, 4.6, JAR_BASE, 40), darkPlastic());
  stand.position.y = JAR_BASE / 2;
  return { model, lid, stand, iceFill: 0.6 };
}

export function buildVessel(kind: Vessel): VesselModel {
  if (kind === 'shaker') return shaker();
  if (kind === 'blender') return blender();
  const spec = kind === 'mixing-glass' ? MIXING_GLASS : TIN;
  return { model: buildShell(spec), lid: null, stand: null, iceFill: 0.7 };
}
