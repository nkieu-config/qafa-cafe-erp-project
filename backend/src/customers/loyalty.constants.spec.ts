import { POINTS_PER_THB, pointsToDiscountBaht } from './loyalty.constants';

describe('loyalty.constants', () => {
  it('defines 10 points per baht', () => {
    expect(POINTS_PER_THB).toBe(10);
  });

  it('converts points to discount baht', () => {
    expect(pointsToDiscountBaht(50)).toBe(5);
    expect(pointsToDiscountBaht(10)).toBe(1);
  });
});
