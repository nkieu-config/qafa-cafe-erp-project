import { isBalancedMoney, roundMoney, roundUnitCost } from './decimal.util';

describe('decimal.util', () => {
  it('rounds money to 2 decimal places', () => {
    expect(roundMoney(99.995)).toBe(100);
    expect(roundMoney(10.004)).toBe(10);
  });

  it('rounds unit cost to 4 decimal places', () => {
    expect(roundUnitCost(0.12345)).toBe(0.1235);
  });

  it('checks journal balance within money epsilon', () => {
    expect(isBalancedMoney(100, 100.009)).toBe(true);
    expect(isBalancedMoney(100, 100.02)).toBe(false);
  });
});
