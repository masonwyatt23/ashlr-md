import { describe, expect, it } from "vitest";
import { applyAllFixes, applyFix, lintDocument, ruleInvalidLinkTarget } from "./mdlint";

describe("empty link destinations", () => {
  it("identifies the link and fixes it without changing surrounding text", () => {
    const doc = "Introduction\nSee [draft]() beside [guide](guide.md).\n";
    const rules = [ruleInvalidLinkTarget];
    const violations = lintDocument(doc, { rules });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      ruleId: "invalid-link-target",
      message: "Invalid link target: [draft](empty)",
      severity: "warning",
      range: {
        from: { offset: 17, line: 2, col: 4 },
        to: { offset: 26, line: 2, col: 13 },
      },
    });
    expect(violations[0].fix).toBeTypeOf("function");
    const fixed = applyFix(doc, violations[0]);
    expect(fixed).toBe("Introduction\nSee [draft](TODO) beside [guide](guide.md).\n");
    expect(lintDocument(fixed, { rules })).toEqual([]);
  });
});

describe("invalid link beside a valid link", () => {
  it.each([
    ["[same](./guide.md)[same]()", "[same](./guide.md)[same](TODO)"],
    ["[same]()[same](./guide.md)", "[same](TODO)[same](./guide.md)"],
  ])("reports and fixes only the empty destination in %s", (doc, expected) => {
    const rules = [ruleInvalidLinkTarget];
    const violations = lintDocument(doc, { rules });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      ruleId: "invalid-link-target",
      message: "Invalid link target: [same](empty)",
      severity: "warning",
    });
    expect(
      doc.slice(violations[0].range!.from.offset, violations[0].range!.to.offset),
    ).toBe("[same]()");
    expect(applyFix(doc, violations[0])).toBe(expected);
    expect(applyAllFixes(doc, violations)).toBe(expected);
    expect(lintDocument(expected, { rules })).toEqual([]);
  });
});
