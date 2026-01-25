import { describe, it, expect } from "vitest";
import { validateConfig, SCRUM_PRESET, KANBAN_PRESET, SIMPLE_PRESET, PRESETS } from "../src/config.js";

describe("validateConfig", () => {
  it("returns no warnings for valid config", () => {
    const warnings = validateConfig({
      ticketBaseUrl: "https://github.com/org/repo/issues",
      scopes: [{ value: "auth", description: "Auth" }],
      checklist: ["Review code"],
    });
    expect(warnings).toEqual([]);
  });

  it("warns on unknown fields", () => {
    const warnings = validateConfig({
      unknownField: true,
      anotherOne: "hi",
    });
    expect(warnings).toHaveLength(2);
    expect(warnings[0].message).toContain("unknownField");
    expect(warnings[1].message).toContain("anotherOne");
  });

  it("warns on scopes missing value", () => {
    const warnings = validateConfig({
      scopes: [{ description: "Missing value" }],
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].field).toBe("scopes[0]");
  });

  it("warns on commitFormat missing required placeholders", () => {
    const warnings = validateConfig({
      commitFormat: "{scope}: {message}",
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("{type}");
  });

  it("accepts valid commitFormat", () => {
    const warnings = validateConfig({
      commitFormat: "{type}({scope}): {message}",
    });
    expect(warnings).toEqual([]);
  });

  it("warns on commitTypes missing value or label", () => {
    const warnings = validateConfig({
      commitTypes: [{ value: "feat" }, { label: "fix" }],
    });
    expect(warnings).toHaveLength(2);
  });

  // New tests for branchFormat
  it("warns on branchFormat missing required placeholders", () => {
    const warnings = validateConfig({
      branchFormat: "{type}/something",
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("{description}");
  });

  it("accepts valid branchFormat with ticket", () => {
    const warnings = validateConfig({
      branchFormat: "{type}/{ticket}_{description}",
    });
    expect(warnings).toEqual([]);
  });

  it("accepts valid branchFormat without ticket (simple preset)", () => {
    const warnings = validateConfig({
      branchFormat: "{type}/{description}",
    });
    expect(warnings).toEqual([]);
  });

  // New tests for preset
  it("warns on invalid preset", () => {
    const warnings = validateConfig({
      preset: "invalid-preset",
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("invalid-preset");
  });

  it("accepts valid preset values", () => {
    for (const preset of ["scrum", "kanban", "simple", "custom"]) {
      const warnings = validateConfig({ preset });
      expect(warnings).toEqual([]);
    }
  });

  // New tests for issueTypes
  it("warns on issueTypes missing required fields", () => {
    const warnings = validateConfig({
      issueTypes: [
        { value: "feature", label: "Feature" }, // missing branchType
        { value: "bug", branchType: "fix" }, // missing label
      ],
    });
    expect(warnings).toHaveLength(2);
    expect(warnings[0].field).toBe("issueTypes[0]");
    expect(warnings[1].field).toBe("issueTypes[1]");
  });

  it("accepts valid issueTypes", () => {
    const warnings = validateConfig({
      issueTypes: [
        { value: "feature", label: "Feature", branchType: "feat", labelColor: "enhancement", fields: [], template: "{description}" },
      ],
    });
    expect(warnings).toEqual([]);
  });

  // Tests for ticketProvider
  it("warns on ticketProvider missing type", () => {
    const warnings = validateConfig({
      ticketProvider: {},
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("type");
  });

  it("warns on unknown ticketProvider type", () => {
    const warnings = validateConfig({
      ticketProvider: { type: "unknown" },
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("unknown");
  });

  it("accepts valid ticketProvider github type", () => {
    const warnings = validateConfig({
      ticketProvider: { type: "github" },
    });
    expect(warnings).toEqual([]);
  });
});

describe("presets", () => {
  it("scrum preset has 5 issue types", () => {
    expect(SCRUM_PRESET.issueTypes).toHaveLength(5);
  });

  it("scrum preset includes user-story, bug, task, spike, tech-debt", () => {
    const types = SCRUM_PRESET.issueTypes.map((t) => t.value);
    expect(types).toContain("user-story");
    expect(types).toContain("bug");
    expect(types).toContain("task");
    expect(types).toContain("spike");
    expect(types).toContain("tech-debt");
  });

  it("scrum preset has ticket in branch format", () => {
    expect(SCRUM_PRESET.branchFormat).toContain("{ticket}");
  });

  it("kanban preset has 4 issue types", () => {
    expect(KANBAN_PRESET.issueTypes).toHaveLength(4);
  });

  it("kanban preset includes feature, bug, improvement, task", () => {
    const types = KANBAN_PRESET.issueTypes.map((t) => t.value);
    expect(types).toContain("feature");
    expect(types).toContain("bug");
    expect(types).toContain("improvement");
    expect(types).toContain("task");
  });

  it("simple preset has 3 issue types", () => {
    expect(SIMPLE_PRESET.issueTypes).toHaveLength(3);
  });

  it("simple preset does not require ticket", () => {
    expect(SIMPLE_PRESET.branchFormat).not.toContain("{ticket}");
    expect(SIMPLE_PRESET.branchFormat).toBe("{type}/{description}");
  });

  it("simple preset has minimal PR template", () => {
    expect(SIMPLE_PRESET.prTemplate.sections).toEqual(["summary", "checklist"]);
    expect(SIMPLE_PRESET.prTemplate.screenshotsTable).toBe(false);
  });

  it("all presets are defined in PRESETS object", () => {
    expect(PRESETS.scrum).toBe(SCRUM_PRESET);
    expect(PRESETS.kanban).toBe(KANBAN_PRESET);
    expect(PRESETS.simple).toBe(SIMPLE_PRESET);
    expect(PRESETS.custom).toBeDefined();
  });
});
