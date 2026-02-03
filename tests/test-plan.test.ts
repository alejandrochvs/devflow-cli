import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  getTestPlan,
  setTestPlan,
  deleteTestPlan,
  listTestPlans,
} from "../src/test-plan.js";

describe("test-plan", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "devflow-test-plan-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("getTestPlan", () => {
    it("returns empty array when no test plan exists", () => {
      const result = getTestPlan("feat/123_feature", tempDir);
      expect(result).toEqual([]);
    });

    it("returns test plan for existing branch", () => {
      setTestPlan("feat/123_feature", ["Step 1", "Step 2"], tempDir);
      const result = getTestPlan("feat/123_feature", tempDir);
      expect(result).toEqual(["Step 1", "Step 2"]);
    });

    it("returns empty array for non-existent branch when other branches exist", () => {
      setTestPlan("feat/123_feature", ["Step 1"], tempDir);
      const result = getTestPlan("fix/456_bugfix", tempDir);
      expect(result).toEqual([]);
    });
  });

  describe("setTestPlan", () => {
    it("creates .devflow directory if not exists", () => {
      setTestPlan("feat/123_feature", ["Step 1"], tempDir);
      expect(existsSync(join(tempDir, ".devflow"))).toBe(true);
    });

    it("creates test-plans.json file", () => {
      setTestPlan("feat/123_feature", ["Step 1"], tempDir);
      expect(existsSync(join(tempDir, ".devflow", "test-plans.json"))).toBe(true);
    });

    it("stores test plan steps correctly", () => {
      setTestPlan("feat/123_feature", ["Step 1", "Step 2", "Step 3"], tempDir);
      const content = JSON.parse(
        readFileSync(join(tempDir, ".devflow", "test-plans.json"), "utf-8")
      );
      expect(content["feat/123_feature"]).toEqual(["Step 1", "Step 2", "Step 3"]);
    });

    it("updates existing test plan", () => {
      setTestPlan("feat/123_feature", ["Old Step"], tempDir);
      setTestPlan("feat/123_feature", ["New Step 1", "New Step 2"], tempDir);
      const result = getTestPlan("feat/123_feature", tempDir);
      expect(result).toEqual(["New Step 1", "New Step 2"]);
    });

    it("removes branch entry when steps is empty array", () => {
      setTestPlan("feat/123_feature", ["Step 1"], tempDir);
      setTestPlan("feat/123_feature", [], tempDir);
      const result = getTestPlan("feat/123_feature", tempDir);
      expect(result).toEqual([]);
    });

    it("preserves other branches when updating one", () => {
      setTestPlan("feat/123_feature", ["Feature Step"], tempDir);
      setTestPlan("fix/456_bugfix", ["Fix Step"], tempDir);

      const feature = getTestPlan("feat/123_feature", tempDir);
      const fix = getTestPlan("fix/456_bugfix", tempDir);

      expect(feature).toEqual(["Feature Step"]);
      expect(fix).toEqual(["Fix Step"]);
    });
  });

  describe("deleteTestPlan", () => {
    it("removes test plan for specified branch", () => {
      setTestPlan("feat/123_feature", ["Step 1"], tempDir);
      deleteTestPlan("feat/123_feature", tempDir);
      const result = getTestPlan("feat/123_feature", tempDir);
      expect(result).toEqual([]);
    });

    it("preserves other branches when deleting one", () => {
      setTestPlan("feat/123_feature", ["Feature Step"], tempDir);
      setTestPlan("fix/456_bugfix", ["Fix Step"], tempDir);

      deleteTestPlan("feat/123_feature", tempDir);

      const feature = getTestPlan("feat/123_feature", tempDir);
      const fix = getTestPlan("fix/456_bugfix", tempDir);

      expect(feature).toEqual([]);
      expect(fix).toEqual(["Fix Step"]);
    });

    it("handles deleting non-existent branch gracefully", () => {
      expect(() => deleteTestPlan("non-existent", tempDir)).not.toThrow();
    });
  });

  describe("listTestPlans", () => {
    it("returns empty object when no test plans exist", () => {
      const result = listTestPlans(tempDir);
      expect(result).toEqual({});
    });

    it("returns all test plans", () => {
      setTestPlan("feat/123_feature", ["Feature Step"], tempDir);
      setTestPlan("fix/456_bugfix", ["Fix Step 1", "Fix Step 2"], tempDir);

      const result = listTestPlans(tempDir);

      expect(result).toEqual({
        "feat/123_feature": ["Feature Step"],
        "fix/456_bugfix": ["Fix Step 1", "Fix Step 2"],
      });
    });

    it("reflects deletions", () => {
      setTestPlan("feat/123_feature", ["Step"], tempDir);
      setTestPlan("fix/456_bugfix", ["Step"], tempDir);
      deleteTestPlan("feat/123_feature", tempDir);

      const result = listTestPlans(tempDir);

      expect(Object.keys(result)).toEqual(["fix/456_bugfix"]);
    });
  });
});
