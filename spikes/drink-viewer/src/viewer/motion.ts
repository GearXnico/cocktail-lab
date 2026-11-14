const LANDING = 0.72;

export const easeOut = (k: number): number => 1 - (1 - k) ** 3;
export const easeInOut = (k: number): number => k * k * (3 - 2 * k);

export function fall(k: number, height: number, hop: number): number {
  if (k < LANDING) return height * (1 - (k / LANDING) ** 2);
  const u = (k - LANDING) / (1 - LANDING);
  return hop * 4 * u * (1 - u);
}
