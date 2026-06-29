import { describe, it, expect } from "vitest";
import { groupAccountsByType } from "./accounts";
import type { Account } from "@/types/api";

const accounts: Account[] = [
  { id: 2, code: "2000", name: "Payables", type: "LIABILITY", isActive: true },
  { id: 1, code: "1000", name: "Cash", type: "ASSET", isActive: true },
];

describe("accounts", () => {
  it("groups and sorts children by code", () => {
    const tree = groupAccountsByType(accounts);
    const assets = tree.find((g) => g.type === "ASSET");
    expect(assets?.children[0].code).toBe("1000");
    expect(tree.some((g) => g.type === "LIABILITY")).toBe(true);
  });
});
