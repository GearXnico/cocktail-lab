import {
  BoxGeometry,
  Euler,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Object3D,
} from 'three';
import type { Ice } from '../recipes';
import type { GlassModel } from './glasses';
import { fall } from './motion';
import { clamp, radiusAt } from './profile';
import type { Rng } from './random';

export interface IceModel {
  object: Object3D;
  setDrop(k: number): void;
}

interface Placement {
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
}

interface Drop {
  fromY: number;
  hop: number;
}

const STAGGER = 0.55;
const HIDDEN = new Vector3(0, 0, 0);

function pile(
  geometry: BufferGeometry,
  faceted: boolean,
  placements: Placement[],
  drop: Drop,
): IceModel {
  const material = new MeshStandardMaterial({
    color: 0xf2fbff,
    roughness: 0.1,
    transparent: true,
    opacity: 0.32,
    flatShading: faceted,
  });
  const pieces = [...placements].sort((a, b) => a.position.y - b.position.y);
  const mesh = new InstancedMesh(geometry, material, pieces.length);
  mesh.renderOrder = 2;
  // The pieces move far from their resting bounds while they drop.
  mesh.frustumCulled = false;
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const position = new Vector3();

  const setDrop = (k: number): void => {
    pieces.forEach((piece, i) => {
      const local = clamp((k - (i / pieces.length) * STAGGER) / (1 - STAGGER), 0, 1);
      position.copy(piece.position);
      position.y += fall(local, drop.fromY - piece.position.y, drop.hop);
      quaternion.setFromEuler(piece.rotation);
      mesh.setMatrixAt(i, matrix.compose(position, quaternion, local > 0 ? piece.scale : HIDDEN));
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  setDrop(1);
  return { object: mesh, setDrop };
}

const around = (radius: number, y: number, angle: number): Vector3 =>
  new Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);

function cubes(glass: GlassModel, rng: Rng, fromY: number): IceModel {
  const { cavity, bottomY, fillY } = glass;
  const size = clamp(radiusAt(cavity, (bottomY + fillY) / 2) * 0.62, 1.1, 2.4);
  const placements: Placement[] = [];
  for (let y = bottomY + size * 0.55; y <= fillY - size * 0.15; y += size * 0.92) {
    const reach = radiusAt(cavity, y - size / 2) - size * 0.74;
    if (reach < 0) continue;
    const count = reach >= size * 0.75 ? 3 : reach >= size * 0.5 ? 2 : 1;
    const start = rng() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const angle = start + (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.3;
      const radius = count === 1 ? reach * rng() * 0.6 : reach * (0.85 + rng() * 0.15);
      const scale = 0.86 + rng() * 0.14;
      placements.push({
        position: around(radius, y, angle),
        rotation: new Euler((rng() - 0.5) * 0.3, rng() * Math.PI, (rng() - 0.5) * 0.3),
        scale: new Vector3(scale, scale, scale),
      });
    }
  }
  return pile(new BoxGeometry(size, size, size), false, placements, { fromY, hop: 0.3 });
}

function largeCube(glass: GlassModel, fromY: number): IceModel {
  const { cavity, bottomY, fillY } = glass;
  const size = Math.min(5, radiusAt(cavity, bottomY + 1) * 1.25);
  const y = Math.max(bottomY + size / 2 + 0.05, fillY - size * 0.38);
  const placement = {
    position: new Vector3(0, y, 0),
    rotation: new Euler(0, 0.5, 0),
    scale: new Vector3(1, 1, 1),
  };
  return pile(new BoxGeometry(size, size, size), false, [placement], { fromY, hop: 0.4 });
}

function crushed(glass: GlassModel, rng: Rng, fromY: number): IceModel {
  const { cavity, bottomY, fillY, rimY } = glass;
  const floor = bottomY + 0.3;
  const top = Math.min(fillY + 0.7, rimY + 0.3);
  const middle = radiusAt(cavity, (bottomY + fillY) / 2);
  const count = Math.round(clamp((fillY - bottomY) * middle * middle * 2.4, 40, 220));
  const placements: Placement[] = [];
  for (let i = 0; i < count; i++) {
    const y = floor + rng() * (top - floor);
    const mound = 1 - (Math.max(0, y - fillY) / 0.9) * 0.8;
    const reach = Math.max(radiusAt(cavity, Math.min(y, rimY)) - 0.45, 0) * mound;
    placements.push({
      position: around(Math.sqrt(rng()) * reach, y, rng() * Math.PI * 2),
      rotation: new Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
      scale: new Vector3(0.6 + rng() * 0.7, 0.6 + rng() * 0.7, 0.6 + rng() * 0.7),
    });
  }
  return pile(new IcosahedronGeometry(0.5, 0), true, placements, { fromY, hop: 0.12 });
}

export function buildIce(kind: Ice, glass: GlassModel, rng: Rng): IceModel {
  const fromY = glass.rimY + 2.5;
  if (kind === 'cubes') return cubes(glass, rng, fromY);
  if (kind === 'large-cube') return largeCube(glass, fromY);
  if (kind === 'crushed') return crushed(glass, rng, fromY);
  return { object: new Group(), setDrop: () => undefined };
}
