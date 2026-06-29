import { formatQueueNumber } from "./queue";

describe("formatQueueNumber", () => {
  it("zero-pads queue numbers", () => {
    expect(formatQueueNumber(3)).toBe("003");
    expect(formatQueueNumber(42)).toBe("042");
  });

  it("returns dash for missing values", () => {
    expect(formatQueueNumber(null)).toBe("—");
    expect(formatQueueNumber(undefined)).toBe("—");
  });
});
