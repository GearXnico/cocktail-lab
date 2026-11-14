import type { Object3D } from 'three';
import type { Container } from './container';
import { easeInOut } from './motion';
import { clamp } from './profile';

const envelope = (k: number): number => easeInOut(clamp(Math.min(k, 1 - k) / 0.18, 0, 1));

export function stir(container: Container, k: number): void {
  container.spoon.visible = true;
  container.spoon.rotation.y = easeInOut(k) * Math.PI * 6;
  container.ice.object.rotation.y = easeInOut(k) * Math.PI * 2;
}

// The closed shaker tips toward the viewer around its middle and slides along
// its own axis, so it never swings over the serving glass.
export function shake(container: Container, lid: Object3D | null, k: number): void {
  const strength = envelope(k);
  const angle = strength * 1.1;
  const half = (lid?.position.y ?? container.model.rimY) / 2;
  const slide = Math.sin(k * Math.PI * 18) * 1.4 * strength - half;
  container.object.rotation.x = angle;
  container.object.position.set(
    container.home.x,
    half + 3 * strength + slide * Math.cos(angle),
    slide * Math.sin(angle),
  );
  container.liquid.object.visible = false;
  if (lid) lid.visible = true;
}

export function blend(container: Container, lid: Object3D | null, k: number): void {
  container.object.position.x = container.home.x + Math.sin(k * 170) * 0.05 * envelope(k);
  container.ice.object.rotation.y = k * 24;
  if (lid) lid.visible = true;
}
