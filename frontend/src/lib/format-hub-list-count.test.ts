import { describe, expect, it } from "vitest";
import {
  formatHubListCount,
  formatHubListCountWithFetching,
  pluralizeItemLabel,
} from "./format-hub-list-count";

describe("pluralizeItemLabel", () => {
  it("uses singular for count 1", () => {
    expect(pluralizeItemLabel(1, "supplier")).toBe("supplier");
  });

  it("uses default plural", () => {
    expect(pluralizeItemLabel(2, "supplier")).toBe("suppliers");
  });

  it("uses custom plural", () => {
    expect(pluralizeItemLabel(3, "entry", "entries")).toBe("entries");
  });
});

describe("formatHubListCount", () => {
  it("formats filtered count", () => {
    expect(
      formatHubListCount({
        hasActiveFilters: true,
        filteredCount: 2,
        totalCount: 5,
        itemLabel: "supplier",
      }),
    ).toBe("2 of 5 suppliers");
  });

  it("formats empty state", () => {
    expect(
      formatHubListCount({
        hasActiveFilters: false,
        filteredCount: 0,
        totalCount: 0,
        itemLabel: "supplier",
      }),
    ).toBe("No suppliers yet");
  });

  it("uses custom empty label", () => {
    expect(
      formatHubListCount({
        hasActiveFilters: false,
        filteredCount: 0,
        totalCount: 0,
        itemLabel: "member",
        emptyLabel: "No members yet",
      }),
    ).toBe("No members yet");
  });

  it("formats total count singular", () => {
    expect(
      formatHubListCount({
        hasActiveFilters: false,
        filteredCount: 1,
        totalCount: 1,
        itemLabel: "asset",
      }),
    ).toBe("1 asset");
  });

  it("formats irregular plural", () => {
    expect(
      formatHubListCount({
        hasActiveFilters: false,
        filteredCount: 2,
        totalCount: 2,
        itemLabel: "promo code",
        itemLabelPlural: "promo codes",
      }),
    ).toBe("2 promo codes");
  });
});

describe("formatHubListCountWithFetching", () => {
  it("appends updating suffix when fetching", () => {
    expect(formatHubListCountWithFetching("5 suppliers", true, false)).toBe(
      "5 suppliers · Updating…",
    );
  });

  it("skips suffix while loading", () => {
    expect(formatHubListCountWithFetching("5 suppliers", true, true)).toBe("5 suppliers");
  });
});
