export type FormatHubListCountOptions = {
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  /** Singular label, e.g. "supplier" */
  itemLabel: string;
  /** Plural label; defaults to `${itemLabel}s` */
  itemLabelPlural?: string;
  /** Shown when totalCount is 0 and no filters active */
  emptyLabel?: string;
};

export function pluralizeItemLabel(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

export function formatHubListCount({
  hasActiveFilters,
  filteredCount,
  totalCount,
  itemLabel,
  itemLabelPlural,
  emptyLabel,
}: FormatHubListCountOptions): string {
  const plural = itemLabelPlural ?? `${itemLabel}s`;

  if (hasActiveFilters) {
    return `${filteredCount} of ${totalCount} ${pluralizeItemLabel(totalCount, itemLabel, itemLabelPlural)}`;
  }

  if (totalCount === 0) {
    return emptyLabel ?? `No ${plural} yet`;
  }

  return `${totalCount} ${pluralizeItemLabel(totalCount, itemLabel, itemLabelPlural)}`;
}

export function formatHubListCountWithFetching(
  base: string,
  isFetching: boolean,
  isLoading: boolean,
): string {
  if (isFetching && !isLoading) {
    return `${base} · Updating…`;
  }
  return base;
}
