import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

export type BranchScopedUser = {
  userId: number;
  role: Role;
  branchId: number | null;
};

function requireOwnBranch(user: BranchScopedUser): number {
  if (user.branchId == null) {
    throw new ForbiddenException('This user is not assigned to a branch.');
  }

  return user.branchId;
}

/**
 * Resolves the effective branch id for a request.
 * Non-SUPER_ADMIN users may only access their own branch.
 */
export function resolveBranchId(
  user: BranchScopedUser,
  requestedBranchId?: number | null,
): number {
  if (user.role === 'SUPER_ADMIN') {
    if (requestedBranchId != null) return requestedBranchId;
    return requireOwnBranch(user);
  }

  const ownBranch = requireOwnBranch(user);

  if (requestedBranchId != null && requestedBranchId !== ownBranch) {
    throw new ForbiddenException('You do not have access to this branch.');
  }

  return ownBranch;
}

/**
 * Like resolveBranchId but returns undefined for SUPER_ADMIN when no branch is
 * requested — used for list/report endpoints that may span all branches.
 */
export function resolveOptionalBranchId(
  user: BranchScopedUser,
  requestedBranchId?: number | null,
): number | undefined {
  if (user.role === 'SUPER_ADMIN') {
    return requestedBranchId ?? undefined;
  }

  const ownBranch = requireOwnBranch(user);

  if (requestedBranchId != null && requestedBranchId !== ownBranch) {
    throw new ForbiddenException('You do not have access to this branch.');
  }

  return ownBranch;
}

/**
 * Ensures non-admin users cannot access another branch's data.
 */
export function assertBranchAccess(
  user: BranchScopedUser,
  branchId: number,
): void {
  if (user.role === 'SUPER_ADMIN') return;

  const ownBranch = requireOwnBranch(user);
  if (branchId !== ownBranch) {
    throw new ForbiddenException('You do not have access to this branch.');
  }
}
