import { describe, expect, it } from "vitest";
import { summaryChipClassName } from "./hub-ui";

describe("summaryChipClassName", () => {
  it("returns hub tone classes for kitchen", () => {
    const cls = summaryChipClassName("kitchen", false);
    expect(cls).toContain("--tone-kitchen-subtle");
    expect(cls).toContain("cursor-pointer");
  });

  it("returns active ring classes when active", () => {
    const cls = summaryChipClassName("inventory", true);
    expect(cls).toContain("--tone-inventory-subtle");
    expect(cls).toContain("ring-1");
  });

  it("merges optional className", () => {
    expect(summaryChipClassName("crm", false, "text-xs")).toContain("text-xs");
  });
});
