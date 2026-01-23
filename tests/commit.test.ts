import { describe, it, expect } from "vitest";
import { formatCommitMessage, fileMatchesPattern, inferScopeFromPaths } from "../src/commands/commit.js";
import { Scope } from "../src/config.js";

describe("formatCommitMessage", () => {
  it("formats with all placeholders filled", () => {
    const result = formatCommitMessage("{type}[{ticket}]{breaking}({scope}): {message}", {
      type: "feat",
      ticket: "ENV-123",
      breaking: "",
      scope: "auth",
      message: "add login",
    });
    expect(result).toBe("feat[ENV-123](auth): add login");
  });

  it("handles breaking change", () => {
    const result = formatCommitMessage("{type}[{ticket}]{breaking}({scope}): {message}", {
      type: "refactor",
      ticket: "ENV-200",
      breaking: "!",
      scope: "api",
      message: "restructure endpoints",
    });
    expect(result).toBe("refactor[ENV-200]!(api): restructure endpoints");
  });

  it("removes empty scope parentheses", () => {
    const result = formatCommitMessage("{type}[{ticket}]{breaking}({scope}): {message}", {
      type: "chore",
      ticket: "UNTRACKED",
      breaking: "",
      scope: "",
      message: "update deps",
    });
    expect(result).toBe("chore[UNTRACKED]: update deps");
  });

  it("removes empty ticket brackets", () => {
    const result = formatCommitMessage("{type}[{ticket}]({scope}): {message}", {
      type: "feat",
      ticket: "",
      breaking: "",
      scope: "ui",
      message: "add button",
    });
    expect(result).toBe("feat(ui): add button");
  });

  it("supports custom format without ticket", () => {
    const result = formatCommitMessage("{type}({scope}): {message}", {
      type: "fix",
      ticket: "ENV-1",
      breaking: "",
      scope: "auth",
      message: "fix crash",
    });
    expect(result).toBe("fix(auth): fix crash");
  });

  it("supports format with breaking after scope", () => {
    const result = formatCommitMessage("{type}({scope}){breaking}: {message}", {
      type: "feat",
      ticket: "",
      breaking: "!",
      scope: "api",
      message: "new endpoints",
    });
    expect(result).toBe("feat(api)!: new endpoints");
  });
});

describe("fileMatchesPattern", () => {
  it("matches exact file path", () => {
    expect(fileMatchesPattern("src/auth/login.ts", "src/auth/login.ts")).toBe(true);
  });

  it("matches single wildcard", () => {
    expect(fileMatchesPattern("src/auth/login.ts", "src/auth/*.ts")).toBe(true);
  });

  it("does not match single wildcard across directories", () => {
    expect(fileMatchesPattern("src/auth/deep/login.ts", "src/auth/*.ts")).toBe(false);
  });

  it("matches globstar pattern", () => {
    expect(fileMatchesPattern("src/auth/deep/login.ts", "src/auth/**")).toBe(true);
  });

  it("matches globstar with extension", () => {
    expect(fileMatchesPattern("src/components/Button.tsx", "src/components/**/*.tsx")).toBe(true);
  });

  it("does not match unrelated path", () => {
    expect(fileMatchesPattern("src/api/client.ts", "src/auth/**")).toBe(false);
  });

  it("matches root level glob", () => {
    expect(fileMatchesPattern("package.json", "*.json")).toBe(true);
  });
});

describe("inferScopeFromPaths", () => {
  const scopes: Scope[] = [
    { value: "auth", description: "Auth", paths: ["src/auth/**"] },
    { value: "ui", description: "UI", paths: ["src/components/**"] },
    { value: "api", description: "API", paths: ["src/api/**", "src/services/**"] },
    { value: "config", description: "Config" },
  ];

  it("infers scope from matching files", () => {
    const result = inferScopeFromPaths(["src/auth/login.ts", "src/auth/signup.ts"], scopes);
    expect(result).toBe("auth");
  });

  it("infers scope with most matches", () => {
    const result = inferScopeFromPaths([
      "src/api/client.ts",
      "src/api/endpoints.ts",
      "src/auth/login.ts",
    ], scopes);
    expect(result).toBe("api");
  });

  it("handles multiple path patterns", () => {
    const result = inferScopeFromPaths(["src/services/user.ts"], scopes);
    expect(result).toBe("api");
  });

  it("returns undefined when no paths match", () => {
    const result = inferScopeFromPaths(["README.md", "package.json"], scopes);
    expect(result).toBeUndefined();
  });

  it("returns undefined when scopes have no paths", () => {
    const noPathScopes: Scope[] = [
      { value: "auth", description: "Auth" },
      { value: "ui", description: "UI" },
    ];
    const result = inferScopeFromPaths(["src/auth/login.ts"], noPathScopes);
    expect(result).toBeUndefined();
  });

  it("handles empty staged files", () => {
    const result = inferScopeFromPaths([], scopes);
    expect(result).toBeUndefined();
  });
});
