/** Must match backend `POINTS_PER_THB` in customers/loyalty.constants.ts */
export const POINTS_PER_THB = 10;

export function pointsToDiscountBaht(points: number): number {
  return points / POINTS_PER_THB;
}
