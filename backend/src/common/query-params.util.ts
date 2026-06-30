import { BadRequestException } from '@nestjs/common';

export function parseOptionalPositiveInt(
  value: string | undefined,
  name: string,
): number | undefined {
  if (value == null || value === '') return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${name} must be a positive integer.`);
  }

  return parsed;
}

export function parseOptionalNonNegativeInt(
  value: string | undefined,
  name: string,
): number | undefined {
  if (value == null || value === '') return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BadRequestException(`${name} must be a non-negative integer.`);
  }

  return parsed;
}
