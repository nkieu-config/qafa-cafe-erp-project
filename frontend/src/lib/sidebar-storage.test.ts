import { describe, expect, it } from "vitest";
import { mergeExpandedGroupsForActivePath } from "./sidebar-storage";

describe("mergeExpandedGroupsForActivePath", () => {
  it("expands the group containing the active route", () => {
    const prev = {
      "Overview & Analytics": true,
      "Store Operations": false,
      "Back Office": false,
      "System Admin": false,
    };
    const next = mergeExpandedGroupsForActivePath(prev, "/inventory/batches");
    expect(next["Store Operations"]).toBe(true);
  });

  it("returns same reference when no change needed", () => {
    const prev = {
      "Overview & Analytics": true,
      "Store Operations": true,
      "Back Office": false,
      "System Admin": false,
    };
    expect(mergeExpandedGroupsForActivePath(prev, "/inventory")).toBe(prev);
  });
});
