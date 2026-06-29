import { describe, expect, it } from "vitest";
import { hubListDataTableProps, hubListTablePagination } from "./data-table";
import { hubAccentIconClass, hubCardIconClass } from "./hub-accent";
import {
  payrollDeductionClassName,
  payrollNetPayClassName,
  payrollOtMetricClassName,
} from "./hub-hr";
import {
  hubDialogContentClassName,
  hubMetaBadgeClassName,
  hubSectionPanelClassName,
} from "./hub-panel";
import { summaryChipClassName } from "./hub-primitives";
import { crmSectionPanelClassName, hrMetaBadgeClassName } from "./hub-section-aliases";
import { metricIconWrapClassName, metricValueClassName } from "./metric";
import {
  formDialogContentClassName,
  touchTargetClassName,
  typeHeadingClassName,
  typeMetricClassName,
  typeMicroClassName,
} from "./typography";

describe("hubCardIconClass", () => {
  it("uses readable -icon bridge classes", () => {
    expect(hubCardIconClass("procurement")).toBe("w-5 h-5 text-hub-procurement-icon");
    expect(hubAccentIconClass("kitchen")).toContain("text-hub-kitchen-icon");
    expect(hubCardIconClass()).toContain("text-hub-products-icon");
  });
});

describe("hubSectionPanelClassName", () => {
  it("uses hub section frame tokens", () => {
    const panel = hubSectionPanelClassName("inventory");
    expect(panel).toContain("hub-section-panel");
    expect(panel).toContain("var(--hub-section-bg)");
    expect(panel).toContain("var(--hub-section-border)");
    expect(panel).toContain("rounded-xl");
  });
});

describe("hub section aliases", () => {
  it("delegates deprecated aliases to parameterized primitives", () => {
    expect(crmSectionPanelClassName()).toBe(hubSectionPanelClassName("crm"));
    expect(hrMetaBadgeClassName()).toBe(hubMetaBadgeClassName("hr"));
  });
});

describe("hubDialogContentClassName", () => {
  it("wraps form dialog shell with max width", () => {
    expect(hubDialogContentClassName(640)).toContain("max-w-[640px]");
  });
});

describe("summaryChipClassName", () => {
  it("applies hub tone and active ring", () => {
    expect(summaryChipClassName("kitchen", false)).toContain("--tone-kitchen-subtle");
    expect(summaryChipClassName("inventory", true)).toContain("ring-1");
    expect(summaryChipClassName("crm", false, "text-xs")).toContain("text-xs");
  });
});

describe("metricValueClassName", () => {
  it("uses semantic tone tokens for values and icon wraps", () => {
    expect(metricValueClassName("blue")).toContain("--metric-blue");
    expect(metricIconWrapClassName("blue")).toContain("--status-blue-bg");
    expect(metricIconWrapClassName("emerald")).toContain("--status-success-bg");
  });
});

describe("typography helpers", () => {
  it("enforce scale and touch targets", () => {
    expect(typeMetricClassName()).toContain("font-black");
    expect(typeHeadingClassName()).toContain("font-bold");
    expect(typeMicroClassName()).toContain("text-xs");
    expect(touchTargetClassName()).toContain("min-h-[44px]");
    expect(formDialogContentClassName(520)).toContain("sm:max-w-[520px]");
  });
});

describe("payroll metric tones", () => {
  it("use blue for OT and red for deductions", () => {
    expect(payrollOtMetricClassName()).toContain("--metric-blue");
    expect(payrollDeductionClassName()).toContain("--metric-red");
    expect(payrollNetPayClassName()).toContain("--metric-emerald");
  });
});

describe("hubListDataTableProps", () => {
  it("enables hideBorders with standard pagination", () => {
    expect(hubListTablePagination()).toEqual({
      pageSize: 15,
      showSizeChanger: true,
      pageSizeOptions: ["10", "15", "25", "50"],
    });
    expect(hubListDataTableProps()).toEqual({
      hideBorders: true,
      pagination: hubListTablePagination(),
    });
  });
});
