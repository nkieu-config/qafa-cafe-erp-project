type DecimalLike = { toNumber(): number };

/** Coerce Prisma Decimal (or number) to JS number for arithmetic/comparisons. */
export function toNum(value: DecimalLike | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}
