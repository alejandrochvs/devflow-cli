import { describe, it, expect } from "vitest";
import { LABEL_TO_BRANCH_TYPE, inferBranchTypeFromLabels } from "../src/providers/tickets.js";

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
