"use client";

import { type ReactNode } from "react";
import { ListToolbar } from "@/components/shared/list-toolbar";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import {
  formatHubListCount,
  formatHubListCountWithFetching,
} from "@/lib/format-hub-list-count";
import { text } from "@/lib/theme";
import { cn } from "@/lib/utils";

type HubListPageRootProps = {
  children: ReactNode;
  /** Hub section panel class from theme, e.g. procurementSectionPanelClassName() */
  className?: string;
};

function HubListPageRoot({ children, className }: HubListPageRootProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

type HubListPageBannerProps = {
  children: ReactNode;
  className?: string;
};

function HubListPageBanner({ children, className }: HubListPageBannerProps) {
  return <div className={className}>{children}</div>;
}

type HubListPageErrorProps = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  loading?: boolean;
  className?: string;
};

function HubListPageError({
  message,
  onRetry,
  retryLabel,
  loading,
  className,
}: HubListPageErrorProps) {
  if (!message) return null;

  return (
    <QueryErrorBanner
      message={message}
      onRetry={onRetry}
      retryLabel={retryLabel}
      loading={loading}
      className={className}
    />
  );
}

type HubListPageCountProps = {
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  hasActiveFilters?: boolean;
  filteredCount?: number;
  totalCount?: number;
  itemLabel?: string;
  itemLabelPlural?: string;
  emptyLabel?: string;
};

function HubListPageCount({
  children,
  actions,
  className,
  isLoading = false,
  isError = false,
  isFetching = false,
  hasActiveFilters = false,
  filteredCount = 0,
  totalCount = 0,
  itemLabel = "item",
  itemLabelPlural,
  emptyLabel,
}: HubListPageCountProps) {
  if (isLoading || isError) return null;

  const textContent =
    children ??
    formatHubListCountWithFetching(
      formatHubListCount({
        hasActiveFilters,
        filteredCount,
        totalCount,
        itemLabel,
        itemLabelPlural,
        emptyLabel,
      }),
      isFetching,
      isLoading,
    );

  if (actions) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <p className={cn("text-sm tabular-nums", text.muted)} aria-live="polite">
          {textContent}
        </p>
        {actions}
      </div>
    );
  }

  return (
    <p
      className={cn("text-sm tabular-nums", text.muted, className)}
      aria-live="polite"
    >
      {textContent}
    </p>
  );
}

type HubListPageBodyProps = {
  children: ReactNode;
  className?: string;
};

function HubListPageBody({ children, className }: HubListPageBodyProps) {
  return <div className={className}>{children}</div>;
}

export const HubListPage = Object.assign(HubListPageRoot, {
  Banner: HubListPageBanner,
  Error: HubListPageError,
  Toolbar: ListToolbar,
  Count: HubListPageCount,
  Body: HubListPageBody,
});

export type { HubListPageCountProps, HubListPageErrorProps, HubListPageRootProps };
