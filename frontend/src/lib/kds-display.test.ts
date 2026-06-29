import { describe, expect, it } from "vitest";
import {
  formatKdsWaitLabel,
  getWaitTimeMinutes,
  splitKdsOrdersByStatus,
  ticketUrgency,
} from "./kds-display";

describe("kds-display", () => {
  it("formats sub-minute waits", () => {
    expect(formatKdsWaitLabel(0)).toBe("<1 min");
  });

  it("computes wait minutes from a fixed clock", () => {
    const createdAt = new Date("2026-06-29T12:00:00Z").toISOString();
    const now = new Date("2026-06-29T12:07:30Z").getTime();
    expect(getWaitTimeMinutes(createdAt, now)).toBe(7);
  });

  it("maps urgency thresholds", () => {
    expect(ticketUrgency(4)).toBe("on-time");
    expect(ticketUrgency(5)).toBe("warning");
    expect(ticketUrgency(10)).toBe("late");
  });

  it("splits orders into pending and preparing columns", () => {
    const result = splitKdsOrdersByStatus([
      { id: 1, status: "PENDING" },
      { id: 2, status: "PREPARING" },
      { id: 3, status: "PENDING" },
    ]);
    expect(result.pending.map((o) => o.id)).toEqual([1, 3]);
    expect(result.preparing.map((o) => o.id)).toEqual([2]);
  });
});
