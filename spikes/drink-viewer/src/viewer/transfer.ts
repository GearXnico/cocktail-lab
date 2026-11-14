import { Vector2 } from 'three';
import type { Container } from './container';
import type { GlassModel } from './glasses';
import { easeInOut } from './motion';
import { clamp } from './profile';
import type { Stream } from './props';

export interface Flow {
  from: number;
  to: number;
  sourceFrom: number;
  sourceTo: number;
  drop: number;
}

const APPROACH = 0.25;
const RETURN = 0.2;
const TILT_START = 0.95;
const TILT_END = 1.95;
const STREAM_TRAVEL = 0.12;
const ORIGIN = new Vector2(0, 0);

const clearance = (target: GlassModel, drop: number): number =>
  target.rimY + target.rimRadius * 0.72 + 0.8 + drop;

export function reachTop(source: GlassModel, target: GlassModel, drop: number): number {
  const radius = source.rimRadius + source.wall;
  return clearance(target, drop) - source.rimY * Math.cos(TILT_END) + radius;
}

// Carries the source over the target, tips it around its lip so the lip stays
// in place while it empties, and brings it back. Returns the pour progress.
export function transfer(
  source: Container,
  target: Container,
  stream: Stream,
  k: number,
  flow: Flow,
): number {
  const side = target.home.x < source.home.x ? -1 : 1;
  const lip = new Vector2(side * (source.model.rimRadius + source.model.wall), source.model.rimY);
  const over = new Vector2(
    target.home.x - side * target.model.rimRadius * 0.15,
    clearance(target.model, flow.drop),
  );
  const near =
    easeInOut(clamp(k / APPROACH, 0, 1)) * (1 - easeInOut(clamp((k - 1 + RETURN) / RETURN, 0, 1)));
  const poured = clamp((k - APPROACH) / (1 - APPROACH - RETURN), 0, 1);
  const angle = -side * near * (TILT_START + (TILT_END - TILT_START) * poured);

  const at = new Vector2(source.home.x + lip.x, lip.y).lerp(over, near);
  at.y += Math.sin(Math.PI * near) * 2;
  const offset = lip.clone().rotateAround(ORIGIN, angle);
  source.object.position.set(at.x - offset.x, at.y - offset.y, 0);
  source.object.rotation.set(0, 0, angle);
  target.object.position.copy(target.home);
  target.object.rotation.set(0, 0, 0);

  const left = flow.sourceFrom + (flow.sourceTo - flow.sourceFrom) * poured;
  if (near < 0.02 || left <= 0.001) source.setLevel(left);
  else {
    const axisY = source.object.position.y + source.liquid.levelY(left) * Math.cos(angle);
    source.liquid.setSurface(Math.min(axisY, at.y - 0.05));
  }

  const level = flow.from + (flow.to - flow.from) * poured;
  target.setLevel(level);
  if (poured <= 0 || poured >= 1) stream.hide();
  else {
    const fall = at.y - target.liquid.levelY(level);
    const head = clamp(poured / STREAM_TRAVEL, 0, 1);
    const tail = clamp((poured - 1 + STREAM_TRAVEL) / STREAM_TRAVEL, 0, 1);
    const look = target.liquid.lookAt((flow.from + flow.to) / 2);
    stream.set(at.x, at.y - fall * tail, at.y - fall * head, look, false);
  }
  return poured;
}
