import {
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type Object3D,
} from 'three';
import { CITRUS, CITRUS_CUTS, type Citrus, type CitrusCut, type GarnishKind } from '../visual-hints';
import { buildCitrus } from './citrus';
import type { GlassModel } from './glasses';
import { at, radiusAt } from './profile';
import type { Rng } from './random';

export interface GarnishContext {
  glass: GlassModel;
  surfaceY: number;
  hasIce: boolean;
  rng: Rng;
}

const RIM_ANGLES = [1, 5, 2.9];
const INNER_ANGLES = [3.7, 2.2, 5.3];
const UP = new Vector3(0, 1, 0);

const around = (radius: number, y: number, angle: number): Vector3 =>
  new Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);

function placed(object: Object3D, position: Vector3, angle: number): Group {
  const group = new Group();
  group.add(object);
  group.position.copy(position);
  group.rotation.y = angle;
  return group;
}

function citrusOf(kind: GarnishKind): { fruit: Citrus; cut: CitrusCut } | null {
  for (const fruit of CITRUS) {
    for (const cut of CITRUS_CUTS) {
      if (kind === `${fruit}-${cut}`) return { fruit, cut };
    }
  }
  return null;
}

function cherry(withStem: boolean): Object3D {
  const group = new Group();
  group.add(
    new Mesh(
      new SphereGeometry(0.85, 20, 14),
      new MeshStandardMaterial({ color: 0x8f0f1f, roughness: 0.15 }),
    ),
  );
  if (withStem) {
    const curve = new QuadraticBezierCurve3(
      new Vector3(0, 0.8, 0),
      new Vector3(0.2, 2, 0),
      new Vector3(0.9, 2.6, 0),
    );
    group.add(
      new Mesh(
        new TubeGeometry(curve, 8, 0.05, 5),
        new MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.8 }),
      ),
    );
  }
  return group;
}

function olive(): Object3D {
  const group = new Group();
  const body = new Mesh(
    new SphereGeometry(0.75, 20, 14),
    new MeshStandardMaterial({ color: 0x7c8a2e, roughness: 0.35 }),
  );
  body.scale.y = 1.25;
  const pimento = new Mesh(
    new SphereGeometry(0.3, 12, 8),
    new MeshStandardMaterial({ color: 0xc0392b, roughness: 0.4 }),
  );
  pimento.position.y = -0.78;
  group.add(body, pimento);
  return group;
}

function mint(rng: Rng): Object3D {
  const material = new MeshStandardMaterial({ color: 0x3d8b37, roughness: 0.7 });
  const leafGeometry = new SphereGeometry(1, 10, 6);
  const group = new Group();
  const stalk = new Mesh(new CylinderGeometry(0.07, 0.09, 2.6, 6), material);
  stalk.position.y = 0.5;
  group.add(stalk);
  for (let tier = 0; tier < 4; tier++) {
    const size = 1.25 - tier * 0.22;
    for (const side of [0, Math.PI]) {
      const pivot = new Group();
      pivot.position.y = 0.4 + tier * 0.45;
      pivot.rotation.y = tier * (Math.PI / 2) + side + (rng() - 0.5) * 0.4;
      const leaf = new Mesh(leafGeometry, material);
      leaf.scale.set(0.6 * size, 0.1 * size, 0.95 * size);
      leaf.position.set(0, 0.35 * size, 0.8 * size);
      leaf.rotation.x = -0.4 - tier * 0.2;
      pivot.add(leaf);
      group.add(pivot);
    }
  }
  group.rotation.x = 0.22;
  return group;
}

function pineapple(): Object3D {
  const radius = 4;
  const half = 0.34;
  const depth = 0.8;
  const from = Math.PI / 2 - half;
  const to = Math.PI / 2 + half;
  const extrude = (shape: Shape, color: number, roughness: number): Mesh => {
    const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });
    geometry.translate(0, -radius * 0.55, -depth / 2);
    return new Mesh(geometry, new MeshStandardMaterial({ color, roughness }));
  };
  const flesh = new Shape().moveTo(0, 0).absarc(0, 0, radius, from, to, false).closePath();
  const rind = new Shape()
    .absarc(0, 0, radius + 0.25, from, to, false)
    .absarc(0, 0, radius, to, from, true)
    .closePath();

  const slice = new Group();
  slice.add(extrude(flesh, 0xf2c230, 0.6), extrude(rind, 0x8f6f2f, 0.9));
  slice.rotation.y = Math.PI / 2;
  const tilt = new Group();
  tilt.add(slice);
  tilt.rotation.x = 0.5;
  tilt.position.y = 0.2;
  return tilt;
}

function saltRim(glass: GlassModel): Object3D {
  const ring = new Mesh(
    new TorusGeometry(glass.rimRadius + glass.wall / 2, 0.17, 8, 72),
    new MeshStandardMaterial({ color: 0xfafafa, roughness: 1 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.scale.z = 1.8;
  ring.position.y = glass.rimY - 0.08;
  return ring;
}

function bittersDrops(ctx: GarnishContext, radius: number): Object3D {
  const material = new MeshStandardMaterial({ color: 0x6e2410, roughness: 0.4 });
  const geometry = new CircleGeometry(0.2, 12);
  const group = new Group();
  for (const angle of [0.2, 0.9, 1.6]) {
    const drop = new Mesh(geometry, material);
    drop.rotation.x = -Math.PI / 2;
    drop.position.copy(around(radius * 0.4, ctx.surfaceY + 0.015, angle));
    group.add(drop);
  }
  return group;
}

function spiceDusting(ctx: GarnishContext, radius: number): Object3D {
  const positions: number[] = [];
  for (let i = 0; i < 110; i++) {
    const spot = around(ctx.rng() * radius * 0.75, ctx.surfaceY + 0.02, ctx.rng() * Math.PI * 2);
    positions.push(spot.x, spot.y, spot.z);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new Points(geometry, new PointsMaterial({ color: 0x6f4320, size: 0.14 }));
}

function onPick(item: Object3D, ctx: GarnishContext, radius: number, angle: number): Object3D {
  const { glass } = ctx;
  const rim = around(glass.rimRadius + glass.wall / 2, glass.rimY + 0.06, angle);
  const tip = around(-radius * 0.25, ctx.surfaceY - 0.35, angle);
  const length = rim.distanceTo(tip) + 2.4;
  const stick = new Mesh(
    new CylinderGeometry(0.06, 0.06, length, 6),
    new MeshStandardMaterial({ color: 0xcdb38a, roughness: 0.7 }),
  );
  stick.position.y = length / 2 - 0.9;
  const group = new Group();
  group.add(stick, item);
  group.position.copy(tip);
  group.quaternion.setFromUnitVectors(UP, rim.sub(tip).normalize());
  return group;
}

export function buildGarnish(kinds: readonly GarnishKind[], ctx: GarnishContext): Group {
  const { glass, surfaceY } = ctx;
  const surfaceRadius = radiusAt(glass.cavity, surfaceY);
  const rimRadius = glass.rimRadius + glass.wall / 2;
  let rimSlot = 0;
  let innerSlot = 0;
  const onRim = (object: Object3D): Object3D => {
    const angle = at(RIM_ANGLES, rimSlot++ % RIM_ANGLES.length);
    return placed(object, around(rimRadius, glass.rimY, angle), angle);
  };
  const innerAngle = (): number => at(INNER_ANGLES, innerSlot++ % INNER_ANGLES.length);
  const onSurface = (object: Object3D, lift: number): Object3D => {
    const angle = innerAngle();
    return placed(object, around(surfaceRadius * 0.5, surfaceY + lift, angle), angle);
  };

  const group = new Group();
  for (const kind of kinds) {
    const citrus = citrusOf(kind);
    if (citrus) group.add(onRim(buildCitrus(citrus.fruit, citrus.cut)));
    else if (kind === 'pineapple') group.add(onRim(pineapple()));
    else if (kind === 'salt-rim') group.add(saltRim(glass));
    else if (kind === 'bitters-drops') group.add(bittersDrops(ctx, surfaceRadius));
    else if (kind === 'spice-dusting') group.add(spiceDusting(ctx, surfaceRadius));
    else if (kind === 'mint') group.add(onSurface(mint(ctx.rng), -0.4));
    else if (kind === 'olive') group.add(onPick(olive(), ctx, surfaceRadius, innerAngle()));
    else if (ctx.hasIce) group.add(onSurface(cherry(true), 0.5));
    else group.add(onPick(cherry(false), ctx, surfaceRadius, innerAngle()));
  }
  return group;
}
