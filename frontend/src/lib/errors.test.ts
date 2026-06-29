import { describe, it, expect } from "vitest";
import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {
  it("reads Error.message", () => {
    expect(getErrorMessage(new Error("bad request"))).toBe("bad request");
  });

  it("reads string errors", () => {
    expect(getErrorMessage("network down")).toBe("network down");
  });

  it("reads object message field", () => {
    expect(getErrorMessage({ message: "Invalid credentials" })).toBe("Invalid credentials");
  });

  it("falls back when unknown", () => {
    expect(getErrorMessage(null)).toBe("Something went wrong");
    expect(getErrorMessage(42, "fallback")).toBe("fallback");
  });
});
