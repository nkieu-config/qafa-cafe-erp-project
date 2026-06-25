type DecimalLike = { toNumber(): number };

export const MONEY_SCALE = 2;
export const UNIT_COST_SCALE = 4;
const MONEY_EPSILON = 0.01;

/** Coerce Prisma Decimal (or number) to JS number for arithmetic/comparisons. */
export function toNum(value: DecimalLike | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

export function roundMoney(value: number): number {
  const factor = 10 ** MONEY_SCALE;
  return Math.round(value * factor) / factor;
}

export function roundUnitCost(value: number): number {
  const factor = 10 ** UNIT_COST_SCALE;
  return Math.round(value * factor) / factor;
}

export function isBalancedMoney(debits: number, credits: number): boolean {
  return Math.abs(debits - credits) <= MONEY_EPSILON;
}
