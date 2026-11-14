import { SplineCurve, Vector2 } from 'three';

export type Pt = readonly [radius: number, y: number];

export function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new RangeError(`No item at ${String(index)}`);
  return item;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const toVectors = (points: readonly Pt[]): Vector2[] =>
  points.map(([radius, y]) => new Vector2(radius, y));

export function smooth(points: Vector2[], divisions = 32): Vector2[] {
  return new SplineCurve(points)
    .getPoints(divisions)
    .map((p) => new Vector2(Math.max(p.x, 0), p.y));
}

export function offsetOutward(points: readonly Vector2[], distance: number): Vector2[] {
  const last = points.length - 1;
  return points.map((p, i) => {
    if (i === last) return new Vector2(p.x + distance, p.y);
    const tangent = at(points, i + 1)
      .clone()
      .sub(at(points, Math.max(i - 1, 0)))
      .normalize();
    return new Vector2(p.x + tangent.y * distance, p.y - tangent.x * distance);
  });
}

export function radiusAt(profile: readonly Vector2[], y: number): number {
  const first = at(profile, 0);
  if (y <= first.y) return first.x;
  for (let i = 1; i < profile.length; i++) {
    const a = at(profile, i - 1);
    const b = at(profile, i);
    if (y > b.y) continue;
    const span = b.y - a.y;
    return span <= 0 ? b.x : a.x + (b.x - a.x) * ((y - a.y) / span);
  }
  return at(profile, profile.length - 1).x;
}

export function below(profile: readonly Vector2[], y: number): Vector2[] {
  return [...profile.filter((p) => p.y < y), new Vector2(radiusAt(profile, y), y)];
}

export function between(profile: readonly Vector2[], from: number, to: number): Vector2[] {
  return [
    new Vector2(radiusAt(profile, from), from),
    ...profile.filter((p) => p.y > from && p.y < to),
    new Vector2(radiusAt(profile, to), to),
  ];
}
