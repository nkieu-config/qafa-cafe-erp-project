import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

type AuthUser = {
  userId: number;
  role: Role;
  branchId: number | null;
};

/**
 * Resolves the effective branch id for a request.
 * Non-SUPER_ADMIN users may only access their own branch.
 */
export function resolveBranchId(
  user: AuthUser,
  requestedBranchId?: number | null,
  fallback = 1,
): number {
  if (user.role === 'SUPER_ADMIN') {
    return requestedBranchId ?? user.branchId ?? fallback;
  }

  const ownBranch = user.branchId ?? fallback;

  if (requestedBranchId != null && requestedBranchId !== ownBranch) {
    throw new ForbiddenException('You do not have access to this branch.');
  }

  return ownBranch;
}

/**
 * Ensures non-admin users cannot access another branch's data.
 */
export function assertBranchAccess(user: AuthUser, branchId: number): void {
  if (user.role === 'SUPER_ADMIN') return;

  const ownBranch = user.branchId;
  if (ownBranch != null && branchId !== ownBranch) {
    throw new ForbiddenException('You do not have access to this branch.');
  }
}
