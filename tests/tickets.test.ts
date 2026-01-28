import { describe, it, expect } from "vitest";
import {
  LABEL_TO_BRANCH_TYPE,
  inferBranchTypeFromLabels,
  parseAcceptanceCriteria,
} from "../src/providers/tickets.js";

describe("LABEL_TO_BRANCH_TYPE", () => {
  it("maps bug to fix", () => {
    expect(LABEL_TO_BRANCH_TYPE.bug).toBe("fix");
  });

  it("maps enhancement to feat", () => {
    expect(LABEL_TO_BRANCH_TYPE.enhancement).toBe("feat");
  });

  it("maps feature to feat", () => {
    expect(LABEL_TO_BRANCH_TYPE.feature).toBe("feat");
  });

  it("maps documentation to docs", () => {
    expect(LABEL_TO_BRANCH_TYPE.documentation).toBe("docs");
  });

  it("maps refactor to refactor", () => {
    expect(LABEL_TO_BRANCH_TYPE.refactor).toBe("refactor");
  });

  it("maps test to test", () => {
    expect(LABEL_TO_BRANCH_TYPE.test).toBe("test");
  });

  it("maps chore to chore", () => {
    expect(LABEL_TO_BRANCH_TYPE.chore).toBe("chore");
  });

  it("maps maintenance to chore", () => {
    expect(LABEL_TO_BRANCH_TYPE.maintenance).toBe("chore");
  });

  it("maps tech-debt to refactor", () => {
    expect(LABEL_TO_BRANCH_TYPE["tech-debt"]).toBe("refactor");
  });
});

describe("inferBranchTypeFromLabels", () => {
  it("infers fix from bug label", () => {
    expect(inferBranchTypeFromLabels(["bug"])).toBe("fix");
  });

  it("infers feat from enhancement label", () => {
    expect(inferBranchTypeFromLabels(["enhancement"])).toBe("feat");
  });

  it("infers feat from feature label", () => {
    expect(inferBranchTypeFromLabels(["feature"])).toBe("feat");
  });

  it("returns first match when multiple labels present", () => {
    expect(inferBranchTypeFromLabels(["bug", "enhancement"])).toBe("fix");
  });

  it("returns undefined for unknown labels", () => {
    expect(inferBranchTypeFromLabels(["unknown", "other"])).toBeUndefined();
  });

  it("returns undefined for empty labels", () => {
    expect(inferBranchTypeFromLabels([])).toBeUndefined();
  });

  it("handles case insensitivity", () => {
    expect(inferBranchTypeFromLabels(["BUG"])).toBe("fix");
    expect(inferBranchTypeFromLabels(["Enhancement"])).toBe("feat");
  });

  it("finds first known label in mixed array", () => {
    expect(inferBranchTypeFromLabels(["priority:high", "status:open", "bug"])).toBe("fix");
  });
});

describe("parseAcceptanceCriteria", () => {
  it("extracts checkbox items from acceptance criteria section", () => {
    const body = `## User Story

**As a** user
**I want to** log in
**So that** I can access my account

## Acceptance Criteria

- [ ] User can log in with email
- [ ] User can log in with Google
- [ ] Error messages are shown for invalid credentials

## Notes

Some additional notes here.`;

    const result = parseAcceptanceCriteria(body);
    expect(result).toEqual([
      "User can log in with email",
      "User can log in with Google",
      "Error messages are shown for invalid credentials",
    ]);
  });

  it("handles checked items", () => {
    const body = `## Acceptance Criteria

- [x] Completed item
- [ ] Pending item`;

    const result = parseAcceptanceCriteria(body);
    expect(result).toEqual(["Completed item", "Pending item"]);
  });

  it("returns empty array when no acceptance criteria section", () => {
    const body = `## User Story

Some content here.`;

    const result = parseAcceptanceCriteria(body);
    expect(result).toEqual([]);
  });

  it("returns empty array for undefined body", () => {
    expect(parseAcceptanceCriteria(undefined)).toEqual([]);
  });

  it("returns empty array for empty body", () => {
    expect(parseAcceptanceCriteria("")).toEqual([]);
  });

  it("handles acceptance criteria at end of body", () => {
    const body = `## Summary

Some summary.

## Acceptance Criteria

- [ ] First item
- [ ] Second item`;

    const result = parseAcceptanceCriteria(body);
    expect(result).toEqual(["First item", "Second item"]);
  });

  it("ignores non-checkbox items in acceptance criteria", () => {
    const body = `## Acceptance Criteria

- [ ] Checkbox item
- Regular list item
* Another regular item
- [ ] Another checkbox`;

    const result = parseAcceptanceCriteria(body);
    expect(result).toEqual(["Checkbox item", "Another checkbox"]);
  });

  it("handles case-insensitive section header", () => {
    const body = `## acceptance criteria

- [ ] Item one`;

    const result = parseAcceptanceCriteria(body);
    expect(result).toEqual(["Item one"]);
  });
});
