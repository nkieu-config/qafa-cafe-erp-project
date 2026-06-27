const ACTIVE_BRANCH_KEY = 'qafa_active_branch_id';

export type BranchSelection = number | null | 'unset';

export function getStoredBranchSelection(): BranchSelection {
  if (typeof window === 'undefined') return 'unset';
  const raw = localStorage.getItem(ACTIVE_BRANCH_KEY);
  if (raw === null) return 'unset';
  if (raw === 'all') return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : 'unset';
}

export function setStoredBranchId(id: number | null): void {
  if (typeof window === 'undefined') return;
  if (id == null) {
    localStorage.setItem(ACTIVE_BRANCH_KEY, 'all');
    return;
  }
  localStorage.setItem(ACTIVE_BRANCH_KEY, String(id));
}

/** Prefer saved branch, then Siam Paragon demo branch, then first available. */
export function resolveDefaultBranchId(
  branches: { id: number; name: string }[],
): number | null {
  if (branches.length === 0) return null;

  const siam = branches.find((b) =>
    b.name.toLowerCase().includes('siam paragon'),
  );
  if (siam) return siam.id;

  return branches[0].id;
}
