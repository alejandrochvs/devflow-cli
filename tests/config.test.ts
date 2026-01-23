import { describe, it, expect } from "vitest";
import { validateConfig } from "../src/config.js";

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
});
