import { describe, it, expect } from "vitest";
import { parseBranch, getScopesFromCommits } from "../src/git.js";

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
