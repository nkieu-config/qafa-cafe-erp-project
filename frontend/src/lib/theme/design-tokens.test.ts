import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = join(import.meta.dirname, "../..");

/** Paths allowed to reference font-black (metrics / immersive / KDS). */
const FONT_BLACK_ALLOWLIST = new Set([
  "lib/theme/typography.ts",
  "lib/theme/immersive.ts",
  "app/(app)/kds/page.tsx",
]);

/** Page-level font-bold/semibold belong in theme typography helpers. */
const FONT_WEIGHT_ALLOWLIST = new Set([
  ...FONT_BLACK_ALLOWLIST,
  "lib/theme/typography.ts",
  "lib/theme/hub-ui.ts",
  "lib/theme/finance.ts",
  "lib/theme/stock.ts",
  "lib/theme/dashboard.ts",
  "lib/theme/immersive.ts",
  "lib/theme/metric.ts",
  "lib/theme/data-table.ts",
  "lib/theme/hub-panel.ts",
  "lib/theme/hub-primitives.ts",
  "lib/theme/hub-banners.ts",
  "lib/theme/hub-section-aliases.ts",
  "lib/theme/hub-products.ts",
  "lib/theme/hub-procurement.ts",
  "lib/theme/hub-kitchen.ts",
  "lib/theme/hub-hr.ts",
  "lib/theme/hub-crm.ts",
  "lib/theme/settings-form-section.ts",
  "lib/theme/assets.ts",
  "lib/theme/settings-hub-chrome.ts",
  "lib/theme/organization.ts",
  "lib/theme/shell.ts",
  "lib/theme/status.ts",
  "components/ui/button.tsx",
  "components/ui/badge.tsx",
  "components/ui/table.tsx",
]);

/** Raw table-container token strings on pages should use theme helpers. */
const TABLE_TOKEN_ALLOWLIST = new Set([
  "lib/theme/data-table.ts",
  "lib/theme/hub-panel.ts",
  "lib/theme/stock.ts",
  "lib/theme/hub-ui.ts",
  "lib/theme/finance.ts",
  "lib/theme/assets.ts",
  "lib/theme/organization.ts",
  "lib/theme/settings-hub-chrome.ts",
  "lib/theme/surface.ts",
  "lib/theme/feedback.ts",
  "lib/theme/immersive.ts",
  "lib/theme/dashboard.ts",
  "styles/theme/utilities.css",
]);

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      walkSourceFiles(fullPath, acc);
    } else if (/\.(tsx?|css)$/.test(entry) && !entry.endsWith(".test.ts")) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function relPath(absPath: string): string {
  return relative(SRC_ROOT, absPath).replace(/\\/g, "/");
}

function walkAppPages(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkAppPages(fullPath, acc);
    } else if (entry.endsWith(".tsx")) {
      acc.push(fullPath);
    }
  }
  return acc;
}

/** Paths allowed to use inline Tailwind `*- [var(--…)]` color utilities. */
const INLINE_COLOR_VAR_ALLOWLIST_PREFIXES = [
  "lib/theme/",
  "components/ui/",
  "styles/",
];

const INLINE_COLOR_VAR_PATTERN =
  /(?:^|\s)(?:hover:|focus:|active:|disabled:)?(?:text|bg|border(?:-[trblxy])?|from|to|ring|shadow|fill|stroke)-\[var\(--/;

const HEX_COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b/;

const INLINE_STYLE_COLOR_PATTERN =
  /style=\{\{[\s\S]*?\b(color|background(?:Color)?|border(?:Color)?|border(?:Top|Bottom|Left|Right)?)\s*:\s*['"]#/;

function isInlineColorVarAllowed(rel: string): boolean {
  return INLINE_COLOR_VAR_ALLOWLIST_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

function isHexColorScanAllowed(rel: string): boolean {
  return (
    isInlineColorVarAllowed(rel) ||
    rel.startsWith("lib/theme/defaults.ts")
  );
}

function walkAppAndComponents(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      walkAppAndComponents(fullPath, acc);
    } else if (/\.tsx?$/.test(entry) && !entry.endsWith(".test.ts")) {
      acc.push(fullPath);
    }
  }
  return acc;
}

describe("design token guards", () => {
  it("forbids font-black outside the metrics/immersive allowlist", () => {
    const violations: string[] = [];

    for (const file of walkSourceFiles(SRC_ROOT)) {
      const rel = relPath(file);
      if (FONT_BLACK_ALLOWLIST.has(rel)) continue;

      const content = readFileSync(file, "utf8");
      if (content.includes("font-black")) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it("forbids text-[10px] micro-type (use typeMicroClassName / text-xs)", () => {
    const violations: string[] = [];

    for (const file of walkSourceFiles(SRC_ROOT)) {
      const rel = relPath(file);
      const content = readFileSync(file, "utf8");
      if (rel === "lib/theme/typography.ts") {
        const withoutComment = content.replace(/\/\*\*[\s\S]*?\*\//g, "");
        if (withoutComment.includes("text-[10px]")) violations.push(rel);
        continue;
      }
      if (content.includes("text-[10px]")) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it("forbids page-level font-bold and font-semibold outside theme allowlist", () => {
    const violations: string[] = [];

    for (const file of walkSourceFiles(SRC_ROOT)) {
      const rel = relPath(file);
      if (FONT_WEIGHT_ALLOWLIST.has(rel)) continue;
      if (!rel.startsWith("app/") && !rel.startsWith("components/")) continue;

      const content = readFileSync(file, "utf8");
      if (/\bfont-bold\b/.test(content) || /\bfont-semibold\b/.test(content)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it("forbids inline --table-container-* tokens on app pages", () => {
    const violations: string[] = [];

    for (const file of walkAppPages(join(SRC_ROOT, "app"))) {
      const rel = relPath(file);
      if (TABLE_TOKEN_ALLOWLIST.has(rel)) continue;

      const content = readFileSync(file, "utf8");
      if (content.includes("--table-container-bg") || content.includes("--table-container-border")) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it("forbids inline CSS variable color utilities in app and components", () => {
    const violations: string[] = [];
    const roots = [join(SRC_ROOT, "app"), join(SRC_ROOT, "components")];

    for (const root of roots) {
      for (const file of walkAppAndComponents(root)) {
        const rel = relPath(file);
        if (isInlineColorVarAllowed(rel)) continue;

        const content = readFileSync(file, "utf8");
        if (INLINE_COLOR_VAR_PATTERN.test(content)) {
          violations.push(rel);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("forbids hardcoded hex colors in app and components", () => {
    const violations: string[] = [];
    const roots = [join(SRC_ROOT, "app"), join(SRC_ROOT, "components")];

    for (const root of roots) {
      for (const file of walkAppAndComponents(root)) {
        const rel = relPath(file);
        if (isHexColorScanAllowed(rel)) continue;

        const content = readFileSync(file, "utf8");
        if (HEX_COLOR_PATTERN.test(content)) {
          violations.push(rel);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("forbids inline style hex colors in app and components", () => {
    const violations: string[] = [];
    const roots = [join(SRC_ROOT, "app"), join(SRC_ROOT, "components")];

    for (const root of roots) {
      for (const file of walkAppAndComponents(root)) {
        const rel = relPath(file);
        if (isHexColorScanAllowed(rel)) continue;

        const content = readFileSync(file, "utf8");
        if (INLINE_STYLE_COLOR_PATTERN.test(content)) {
          violations.push(rel);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
