import { describe, it, expect } from "vitest";
import { parseBranch, getScopesFromCommits, isProtectedBranch } from "../src/git.js";

describe("parseBranch", () => {
  it("parses standard branch format", () => {
    const result = parseBranch("feat/ENV-123_add-budget-sharing");
    expect(result).toEqual({
      type: "feat",
      ticket: "ENV-123",
      description: "add budget sharing",
    });
  });

  it("handles fix branch type", () => {
    const result = parseBranch("fix/PROJ-45_correct-overflow");
    expect(result).toEqual({
      type: "fix",
      ticket: "PROJ-45",
      description: "correct overflow",
    });
  });

  it("handles UNTRACKED in branch name", () => {
    const result = parseBranch("chore/UNTRACKED_update-deps");
    expect(result).toEqual({
      type: "chore",
      ticket: "UNTRACKED",
      description: "update deps",
    });
  });

  it("returns defaults for non-matching branch", () => {
    const result = parseBranch("main");
    expect(result).toEqual({
      type: undefined,
      ticket: "UNTRACKED",
      description: "main",
    });
  });

  it("handles branch with multiple hyphens in description", () => {
    const result = parseBranch("feat/ENV-1_add-new-auth-flow");
    expect(result).toEqual({
      type: "feat",
      ticket: "ENV-1",
      description: "add new auth flow",
    });
  });

  it("handles numeric-only ticket", () => {
    const result = parseBranch("fix/123_bug-fix");
    expect(result).toEqual({
      type: "fix",
      ticket: "123",
      description: "bug fix",
    });
  });

  // Tests with custom formats
  describe("with custom format", () => {
    it("parses simple format without ticket", () => {
      const result = parseBranch("feat/add-login", "{type}/{description}");
      expect(result).toEqual({
        type: "feat",
        ticket: "UNTRACKED",
        description: "add login",
      });
    });

    it("parses standard format with ticket", () => {
      const result = parseBranch("fix/BUG-42_fix-crash", "{type}/{ticket}_{description}");
      expect(result).toEqual({
        type: "fix",
        ticket: "BUG-42",
        description: "fix crash",
      });
    });

    it("returns UNTRACKED when simple format branch doesn't match", () => {
      const result = parseBranch("main", "{type}/{description}");
      expect(result).toEqual({
        type: undefined,
        ticket: "UNTRACKED",
        description: "main",
      });
    });

    it("handles issue number format like #123", () => {
      const result = parseBranch("feat/#123_add-feature", "{type}/{ticket}_{description}");
      expect(result).toEqual({
        type: "feat",
        ticket: "#123",
        description: "add feature",
      });
    });
  });
});

describe("getScopesFromCommits", () => {
  it("extracts scopes from conventional commits", () => {
    const commits = [
      "feat[ENV-1](auth): add login",
      "fix[ENV-2](budget): fix overflow",
      "chore[UNTRACKED](deps): update deps",
    ];
    const scopes = getScopesFromCommits(commits);
    expect(scopes).toEqual(["auth", "budget", "deps"]);
  });

  it("deduplicates scopes", () => {
    const commits = [
      "feat[ENV-1](auth): add login",
      "fix[ENV-2](auth): fix logout",
    ];
    const scopes = getScopesFromCommits(commits);
    expect(scopes).toEqual(["auth"]);
  });

  it("handles commits without scopes", () => {
    const commits = ["initial commit", "update readme"];
    const scopes = getScopesFromCommits(commits);
    expect(scopes).toEqual([]);
  });

  it("handles empty commit list", () => {
    const scopes = getScopesFromCommits([]);
    expect(scopes).toEqual([]);
  });
});

describe("isProtectedBranch", () => {
  it("returns true for main branch", () => {
    expect(isProtectedBranch("main")).toBe(true);
  });

  it("returns true for master branch", () => {
    expect(isProtectedBranch("master")).toBe(true);
  });

  it("returns true for develop branch", () => {
    expect(isProtectedBranch("develop")).toBe(true);
  });

  it("returns true for production branch", () => {
    expect(isProtectedBranch("production")).toBe(true);
  });

  it("returns false for feature branch", () => {
    expect(isProtectedBranch("feat/123_add-feature")).toBe(false);
  });

  it("returns false for fix branch", () => {
    expect(isProtectedBranch("fix/456_bug-fix")).toBe(false);
  });

  it("returns false for arbitrary branch name", () => {
    expect(isProtectedBranch("my-custom-branch")).toBe(false);
  });

  it("returns false for branch containing protected name as substring", () => {
    expect(isProtectedBranch("feat/main-feature")).toBe(false);
    expect(isProtectedBranch("main-backup")).toBe(false);
  });
});
