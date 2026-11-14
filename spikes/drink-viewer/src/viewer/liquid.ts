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
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { GlassModel } from './glasses';
import { below, between, clamp, radiusAt } from './profile';

export interface LiquidLayer {
  color: string;
  share: number;
}

export interface LiquidOptions {
  layers: readonly LiquidLayer[];
  blend: number;
  cloudy: boolean;
  foam: string | undefined;
  scoop: string | undefined;
}

export interface Liquid {
  object: Group;
  surfaceY: number;
  setLevel(level: number): void;
}

const INSET = 0.04;
const FOAM_DEPTH = 0.45;

function smoothstep(from: number, to: number, value: number): number {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
}

function gradient(layers: readonly LiquidLayer[], blend: number): (t: number) => Color {
  const total = layers.reduce((sum, layer) => sum + layer.share, 0);
  const stops = layers.map((layer) => ({
    color: new Color(layer.color),
    share: layer.share / total,
  }));
  return (t) => {
    const color = new Color();
    let edge = 0;
    stops.forEach((stop, i) => {
      if (i === 0) color.copy(stop.color);
      else color.lerp(stop.color, smoothstep(edge - blend, edge + blend, t));
      edge += stop.share;
    });
    return color;
  };
}

export function buildLiquid(glass: GlassModel, options: LiquidOptions): Liquid {
  const { cavity, bottomY, fillY } = glass;
  const depth = fillY - bottomY;
  const colorAt = gradient(options.layers, options.blend);
  // Kept just inside the cavity so the two surfaces never share a depth value.
  const inset = (p: Vector2): Vector2 =>
    new Vector2(Math.max(p.x - INSET, 0), Math.max(p.y, bottomY + INSET));

  const bodyGeometry = new LatheGeometry(below(cavity, fillY).map(inset), 64);
  const position = bodyGeometry.getAttribute('position');
  const colors: number[] = [];
  for (let i = 0; i < position.count; i++) {
    colors.push(...colorAt((position.getY(i) - bottomY) / depth).toArray());
  }
  bodyGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

  const clip = new Plane(new Vector3(0, -1, 0), fillY);
  const opacity = options.cloudy ? 0.96 : 0.72;
  const body = new Mesh(
    bodyGeometry,
    new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.35,
      transparent: true,
      opacity,
      depthWrite: options.cloudy,
      side: DoubleSide,
      clippingPlanes: [clip],
    }),
  );
  body.renderOrder = 1;

  const capMaterial = new MeshStandardMaterial({
    roughness: 0.08,
    transparent: true,
    opacity: Math.min(opacity + 0.15, 1),
    depthWrite: options.cloudy,
  });
  const cap = new Mesh(new CircleGeometry(1, 64), capMaterial);
  cap.rotation.x = -Math.PI / 2;
  cap.renderOrder = 1;

  const toppings = new Group();
  let surfaceY = fillY;
  if (options.foam) {
    surfaceY = Math.min(fillY + FOAM_DEPTH, glass.rimY - 0.05);
    const profile = [...between(cavity, fillY, surfaceY).map(inset), new Vector2(0, surfaceY)];
    toppings.add(
      new Mesh(
        new LatheGeometry(profile, 64),
        new MeshStandardMaterial({ color: options.foam, roughness: 0.95 }),
      ),
    );
  }
  if (options.scoop) {
    const radius = Math.min(radiusAt(cavity, fillY) * 0.8, 2.3);
    const scoop = new Mesh(
      new SphereGeometry(radius, 24, 16),
      new MeshStandardMaterial({ color: options.scoop, roughness: 0.9 }),
    );
    scoop.position.y = fillY + radius * 0.35;
    toppings.add(scoop);
  }

  const object = new Group();
  object.add(body, cap, toppings);

  return {
    object,
    surfaceY,
    setLevel(level) {
      const y = bottomY + depth * level;
      const full = level >= 1;
      const radius = Math.max(radiusAt(cavity, y) - INSET, 0.001);
      // The plane is in world space, so it is moved out of the way once the
      // glass is full and free to wobble.
      clip.constant = full ? fillY + 1000 : y;
      body.visible = cap.visible = level > 0;
      cap.position.y = y;
      cap.scale.set(radius, radius, 1);
      capMaterial.color.copy(colorAt(level));
      toppings.visible = full;
    },
  };
}
