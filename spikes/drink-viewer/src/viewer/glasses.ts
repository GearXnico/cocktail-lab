import {
  CustomBlending,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  OneFactor,
  OneMinusSrcAlphaFactor,
  TorusGeometry,
  type Material,
  type Vector2,
} from 'three';
import type { Glass } from '../recipes';
import { at, offsetOutward, radiusAt, smooth, toVectors, type Pt } from './profile';

type Shell = 'glass' | 'copper' | 'ceramic' | 'steel';

export interface GlassSpec {
  foot: readonly Pt[];
  cavity: readonly Pt[];
  outer?: readonly Pt[];
  curved?: true;
  handle?: true;
  wall: number;
  fill: number;
  shell: Shell;
}

export interface GlassModel {
  object: Group;
  cavity: Vector2[];
  bottomY: number;
  rimY: number;
  rimRadius: number;
  wall: number;
  fillY: number;
  radius: number;
}

const stem = (top: number): Pt[] => [
  [0, 0],
  [3.3, 0],
  [3.3, 0.15],
  [0.9, 0.45],
  [0.32, 1.1],
  [0.32, top],
];

const flat = (radius: number): Pt[] => [
  [0, 0],
  [radius, 0],
];

const SPECS: Record<Glass, GlassSpec> = {
  coupe: {
    foot: stem(8.6),
    cavity: [[0, 9], [2.6, 9.3], [4.4, 10.4], [5, 11.8], [5.1, 12.7]],
    curved: true,
    wall: 0.14,
    fill: 0.78,
    shell: 'glass',
  },
  cocktail: {
    foot: stem(8.2),
    cavity: [[0, 8.6], [5.6, 13.4]],
    wall: 0.16,
    fill: 0.82,
    shell: 'glass',
  },
  'nick-and-nora': {
    foot: stem(8.1),
    cavity: [[0, 8.5], [1.9, 8.9], [3.1, 10.3], [3.4, 12], [3.25, 13.8]],
    curved: true,
    wall: 0.14,
    fill: 0.8,
    shell: 'glass',
  },
  rocks: {
    foot: flat(4),
    cavity: [[0, 1.3], [3.75, 1.3], [4.1, 9]],
    wall: 0.22,
    fill: 0.72,
    shell: 'glass',
  },
  highball: {
    foot: flat(3.25),
    cavity: [[0, 1], [3.05, 1], [3.3, 14]],
    wall: 0.18,
    fill: 0.85,
    shell: 'glass',
  },
  collins: {
    foot: flat(2.95),
    cavity: [[0, 1], [2.75, 1], [2.9, 16.5]],
    wall: 0.18,
    fill: 0.86,
    shell: 'glass',
  },
  flute: {
    foot: stem(7.2),
    cavity: [[0, 7.6], [1.3, 8.4], [2.3, 11], [2.6, 15], [2.45, 21]],
    curved: true,
    wall: 0.12,
    fill: 0.8,
    shell: 'glass',
  },
  wine: {
    foot: stem(7.4),
    cavity: [[0, 7.8], [2.4, 8.2], [4.1, 10.2], [4.6, 13], [4.3, 16], [3.8, 18.4]],
    curved: true,
    wall: 0.12,
    fill: 0.68,
    shell: 'glass',
  },
  'copper-mug': {
    foot: flat(4.15),
    cavity: [[0, 0.5], [3.9, 0.5], [4.2, 9.6]],
    handle: true,
    wall: 0.22,
    fill: 0.85,
    shell: 'copper',
  },
  'tiki-mug': {
    foot: flat(3.6),
    cavity: [[0, 1], [3.1, 1], [3.4, 14.5]],
    outer: [
      [0, 0], [3.6, 0], [3.95, 1.6], [3.65, 3.2], [4.05, 5.4],
      [3.7, 7.6], [4.1, 9.8], [3.75, 12], [4, 13.6], [3.75, 14.5],
    ],
    wall: 0.35,
    fill: 0.86,
    shell: 'ceramic',
  },
};

function shellMaterial(shell: Shell): Material {
  if (shell === 'copper') {
    return new MeshStandardMaterial({ color: 0xb87333, metalness: 1, roughness: 0.3 });
  }
  if (shell === 'steel') {
    return new MeshStandardMaterial({ color: 0xcfd3d6, metalness: 1, roughness: 0.28 });
  }
  if (shell === 'ceramic') {
    return new MeshStandardMaterial({ color: 0x6b4a34, roughness: 0.6 });
  }
  // Reflections are added at full strength while opacity only darkens what is
  // behind, which reads as glass without a transmission pass.
  return new MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.06,
    envMapIntensity: 0.12,
    transparent: true,
    opacity: 0.1,
    side: DoubleSide,
    depthWrite: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
  });
}

function outline(spec: GlassSpec, cavity: Vector2[]): Vector2[] {
  if (spec.outer) {
    const [base, ...wall] = toVectors(spec.outer);
    return base ? [base, ...smooth(wall, 48)] : [];
  }
  const foot = toVectors(spec.foot);
  const footRadius = at(foot, foot.length - 1).x;
  return [...foot, ...offsetOutward(cavity, spec.wall).filter((p) => p.x > footRadius)];
}

export const buildGlass = (kind: Glass): GlassModel => buildShell(SPECS[kind]);

export function buildShell(spec: GlassSpec): GlassModel {
  const raw = toVectors(spec.cavity);
  const cavity = spec.curved ? smooth(raw) : raw;
  const outer = outline(spec, cavity);
  const material = shellMaterial(spec.shell);

  const shell = new Mesh(new LatheGeometry([...outer, ...[...cavity].reverse()], 72), material);
  shell.renderOrder = 3;
  const object = new Group();
  object.add(shell);

  const bottomY = at(cavity, 0).y;
  const rim = at(cavity, cavity.length - 1);
  const radius = Math.max(...outer.map((p) => p.x));

  if (spec.handle) {
    const middle = (bottomY + rim.y) / 2;
    const handle = new Mesh(new TorusGeometry(2, 0.3, 10, 24, Math.PI), material);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-(radiusAt(cavity, middle) + spec.wall), middle, 0);
    object.add(handle);
  }

  return {
    object,
    cavity,
    bottomY,
    rimY: rim.y,
    rimRadius: rim.x,
    wall: spec.wall,
    fillY: bottomY + (rim.y - bottomY) * spec.fill,
    radius: spec.handle ? radius + 2.3 : radius,
  };
}
