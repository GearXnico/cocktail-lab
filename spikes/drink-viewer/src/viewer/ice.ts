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
import { clamp, radiusAt } from './profile';
import type { Rng } from './random';

interface Placement {
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
}

function pile(geometry: BufferGeometry, faceted: boolean, placements: Placement[]): Object3D {
  const material = new MeshStandardMaterial({
    color: 0xf2fbff,
    roughness: 0.1,
    transparent: true,
    opacity: 0.32,
    flatShading: faceted,
  });
  const mesh = new InstancedMesh(geometry, material, placements.length);
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  placements.forEach((p, i) => {
    mesh.setMatrixAt(i, matrix.compose(p.position, quaternion.setFromEuler(p.rotation), p.scale));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.renderOrder = 2;
  return mesh;
}

const around = (radius: number, y: number, angle: number): Vector3 =>
  new Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);

function cubes(glass: GlassModel, rng: Rng): Object3D {
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
  return pile(new BoxGeometry(size, size, size), false, placements);
}

function largeCube(glass: GlassModel): Object3D {
  const { cavity, bottomY, fillY } = glass;
  const size = Math.min(5, radiusAt(cavity, bottomY + 1) * 1.25);
  const y = Math.max(bottomY + size / 2 + 0.05, fillY - size * 0.38);
  return pile(new BoxGeometry(size, size, size), false, [
    { position: new Vector3(0, y, 0), rotation: new Euler(0, 0.5, 0), scale: new Vector3(1, 1, 1) },
  ]);
}

function crushed(glass: GlassModel, rng: Rng): Object3D {
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
  return pile(new IcosahedronGeometry(0.5, 0), true, placements);
}

export function buildIce(kind: Ice, glass: GlassModel, rng: Rng): Object3D {
  if (kind === 'cubes') return cubes(glass, rng);
  if (kind === 'large-cube') return largeCube(glass);
  if (kind === 'crushed') return crushed(glass, rng);
  return new Group();
}
