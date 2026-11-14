import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Object3D,
} from 'three';
import type { SolidKind } from '../visual-hints';
import { buildCitrus } from './citrus';
import type { GlassModel } from './glasses';
import { radiusAt } from './profile';
import type { Rng } from './random';

export interface Solid {
  object: Object3D;
  dissolves: boolean;
  topY(): number;
  settle(surfaceY: number, lift: number): void;
}

interface Shape {
  piece: Object3D;
  halfWidth: number;
  halfHeight: number;
  floats?: number;
  dissolves?: true;
}

const SCOOP_COLOR = '#f4ecd0';
const SCOOP_ABOVE_SURFACE = 0.35;

const sugarMaterial = (): MeshStandardMaterial =>
  new MeshStandardMaterial({ color: 0xfbfaf5, roughness: 1 });

function ring(count: number, reach: number, rng: Rng, make: () => Object3D): Group {
  const group = new Group();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.6;
    const holder = new Group();
    holder.add(make());
    holder.position.set(Math.sin(angle) * reach, 0, Math.cos(angle) * reach);
    holder.rotation.set((rng() - 0.5) * 0.7, rng() * Math.PI * 2, (rng() - 0.5) * 0.7);
    group.add(holder);
  }
  return group;
}

function scoop(glass: GlassModel, color: string): Shape {
  const radius = Math.min(radiusAt(glass.cavity, glass.fillY) * 0.8, 2.3);
  const piece = new Mesh(
    new SphereGeometry(radius, 24, 16),
    new MeshStandardMaterial({ color, roughness: 0.9 }),
  );
  return { piece, halfWidth: radius, halfHeight: radius, floats: radius * SCOOP_ABOVE_SURFACE };
}

function sugarCube(): Shape {
  const piece = new Mesh(new BoxGeometry(0.8, 0.8, 0.8), sugarMaterial());
  piece.rotation.y = 0.5;
  return { piece, halfWidth: 0.57, halfHeight: 0.4, dissolves: true };
}

function sugar(): Shape {
  const piece = new Mesh(new SphereGeometry(0.9, 16, 8), sugarMaterial());
  piece.scale.y = 0.3;
  return { piece, halfWidth: 0.9, halfHeight: 0.27, dissolves: true };
}

function mintLeaves(reach: number, rng: Rng): Shape {
  const geometry = new SphereGeometry(1, 10, 6);
  const material = new MeshStandardMaterial({ color: 0x3d8b37, roughness: 0.7 });
  const piece = ring(6, reach, rng, () => {
    const leaf = new Mesh(geometry, material);
    leaf.scale.set(0.45, 0.06, 0.8);
    return leaf;
  });
  return { piece, halfWidth: reach, halfHeight: 0.25 };
}

function limeWedges(reach: number, rng: Rng): Shape {
  const piece = ring(4, reach, rng, () => {
    const wedge = new Group();
    wedge.add(buildCitrus('lime', 'wedge'));
    wedge.scale.setScalar(0.55);
    wedge.position.y = -0.2;
    return wedge;
  });
  return { piece, halfWidth: reach, halfHeight: 0.55 };
}

function shapeOf(kind: SolidKind, glass: GlassModel, color: string, rng: Rng): Shape {
  const reach = radiusAt(glass.cavity, glass.bottomY + 0.6) * 0.55;
  if (kind === 'scoop') return scoop(glass, color);
  if (kind === 'sugar-cube') return sugarCube();
  if (kind === 'sugar') return sugar();
  if (kind === 'mint-leaves') return mintLeaves(reach, rng);
  return limeWedges(reach, rng);
}

function seatY(glass: GlassModel, shape: Shape): number {
  let y = glass.bottomY;
  while (y < glass.fillY && radiusAt(glass.cavity, y) < shape.halfWidth) y += 0.1;
  return Math.max(y, glass.bottomY + shape.halfHeight);
}

export function buildSolid(
  kind: SolidKind,
  glass: GlassModel,
  scoopColor: string | undefined,
  rng: Rng,
): Solid {
  const shape = shapeOf(kind, glass, scoopColor ?? SCOOP_COLOR, rng);
  const seat = seatY(glass, shape);
  const object = new Group();
  object.add(shape.piece);
  object.position.y = seat;

  return {
    object,
    dissolves: shape.dissolves ?? false,
    topY: () => object.position.y + shape.halfHeight,
    settle(surfaceY, lift) {
      const afloat = shape.floats === undefined ? seat : Math.max(seat, surfaceY + shape.floats);
      object.position.y = afloat + lift;
    },
  };
}
