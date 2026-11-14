import {
  CircleGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Plane,
  Vector2,
  Vector3,
} from 'three';
import type { Look } from '../steps';
import type { GlassModel } from './glasses';
import { below, between, clamp, radiusAt } from './profile';

export interface LiquidLayer {
  color: string;
  share: number;
}

export interface Band extends Look {
  from: number;
}

export interface LiquidOptions {
  bands: readonly Band[];
  layers: readonly LiquidLayer[];
  blend: number;
  cloudy: boolean;
  foam: string | undefined;
}

export interface Liquid {
  object: Group;
  surfaceY: number;
  levelY(level: number): number;
  lookAt(level: number): { color: Color; opacity: number };
  setMix(mix: number): void;
  setLevel(level: number, lift?: number): void;
  setSurface(worldY: number): void;
  setFoam(amount: number): void;
}

interface Stop {
  from: number;
  color: Color;
  opacity: number;
}

type Sampler = (level: number, into: Color) => number;

const INSET = 0.04;
const FOAM_DEPTH = 0.45;
const BAND_BLEND = 0.02;

function smoothstep(from: number, to: number, value: number): number {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
}

function sampler(stops: readonly Stop[], soft: number): Sampler {
  const edge = Math.max(soft, 0.001);
  return (level, into) => {
    let opacity = 0;
    stops.forEach((stop, i) => {
      const weight = i === 0 ? 1 : smoothstep(stop.from - edge, stop.from + edge, level);
      into.lerp(stop.color, weight);
      opacity += (stop.opacity - opacity) * weight;
    });
    return opacity;
  };
}

function finalStops(options: LiquidOptions): Stop[] {
  const total = options.layers.reduce((sum, layer) => sum + layer.share, 0);
  let from = 0;
  return options.layers.map((layer) => {
    const stop = { from, color: new Color(layer.color), opacity: options.cloudy ? 0.96 : 0.72 };
    from += layer.share / total;
    return stop;
  });
}

export function buildLiquid(glass: GlassModel, options: LiquidOptions): Liquid {
  const { cavity, bottomY, fillY } = glass;
  const depth = fillY - bottomY;
  const mixedLook = sampler(finalStops(options), options.blend);
  const pouredLook = options.bands.length
    ? sampler(
        options.bands.map((band) => ({ ...band, color: new Color(band.color) })),
        BAND_BLEND,
      )
    : mixedLook;
  // Kept just inside the cavity so the two surfaces never share a depth value.
  const inset = (p: Vector2): Vector2 =>
    new Vector2(Math.max(p.x - INSET, 0), Math.max(p.y, bottomY + INSET));

  const bodyGeometry = new LatheGeometry(below(cavity, fillY).map(inset), 64);
  const position = bodyGeometry.getAttribute('position');
  const scratch = new Color();
  const sampled = (look: Sampler): Float32Array => {
    const values = new Float32Array(position.count * 4);
    for (let i = 0; i < position.count; i++) {
      const opacity = look((position.getY(i) - bottomY) / depth, scratch);
      values.set([scratch.r, scratch.g, scratch.b, opacity], i * 4);
    }
    return values;
  };
  const poured = sampled(pouredLook);
  const mixed = sampled(mixedLook);
  const colors = new Float32BufferAttribute(new Float32Array(poured), 4);
  bodyGeometry.setAttribute('color', colors);

  const clip = new Plane(new Vector3(0, -1, 0), fillY);
  const bodyMaterial = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    clippingPlanes: [clip],
  });
  const body = new Mesh(bodyGeometry, bodyMaterial);
  body.renderOrder = 1;

  const capMaterial = new MeshStandardMaterial({
    roughness: 0.08,
    transparent: true,
    depthWrite: false,
  });
  const cap = new Mesh(new CircleGeometry(1, 64), capMaterial);
  cap.rotation.x = -Math.PI / 2;
  cap.renderOrder = 1;

  const object = new Group();
  object.add(body, cap);

  let surfaceY = fillY;
  let foam: Mesh | null = null;
  if (options.foam) {
    surfaceY = Math.min(fillY + FOAM_DEPTH, glass.rimY - 0.05);
    const profile = [...between(cavity, fillY, surfaceY).map(inset), new Vector2(0, surfaceY)];
    foam = new Mesh(
      new LatheGeometry(profile, 64),
      new MeshStandardMaterial({ color: options.foam, roughness: 0.95 }),
    );
    object.add(foam);
  }

  let mix = 0;
  let current = 0;
  const levelY = (level: number): number => bottomY + depth * level;
  const lookAt = (level: number): { color: Color; opacity: number } => {
    const color = new Color();
    const target = new Color();
    const before = pouredLook(level, color);
    const after = mixedLook(level, target);
    return { color: color.lerp(target, mix), opacity: before + (after - before) * mix };
  };
  const tintCap = (): void => {
    const look = lookAt(current);
    capMaterial.color.copy(look.color);
    capMaterial.opacity = Math.min(look.opacity + 0.15, 1);
  };

  return {
    object,
    surfaceY,
    levelY,
    lookAt,
    setMix(value) {
      mix = value;
      const array = colors.array;
      for (let i = 0; i < array.length; i++) {
        const from = poured[i] ?? 0;
        array[i] = from + ((mixed[i] ?? 0) - from) * mix;
      }
      colors.needsUpdate = true;
      bodyMaterial.depthWrite = capMaterial.depthWrite = options.cloudy && mix >= 1;
      tintCap();
    },
    setLevel(level, lift = 0) {
      current = level;
      const y = levelY(level);
      const radius = Math.max(radiusAt(cavity, y) - INSET, 0.001);
      // Clipping planes are in world space, so a lifted container passes its lift.
      clip.constant = y + lift;
      body.visible = cap.visible = level > 0;
      cap.position.y = y;
      cap.scale.set(radius, radius, 1);
      tintCap();
    },
    setSurface(worldY) {
      clip.constant = worldY;
      body.visible = true;
      cap.visible = false;
    },
    setFoam(amount) {
      if (!foam) return;
      foam.visible = amount > 0;
      foam.scale.y = amount;
      foam.position.y = fillY * (1 - amount);
    },
  };
}
