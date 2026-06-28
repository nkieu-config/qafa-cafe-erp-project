import { describe, expect, it } from "vitest";
import { withAllFilterOption } from "@/components/shared/list-filters";

describe("withAllFilterOption", () => {
  it("prepends an all sentinel option", () => {
    expect(
      withAllFilterOption("ALL", "All items", [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ]),
    ).toEqual([
      { value: "ALL", label: "All items" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]);
  });
});
