/**
 * Integration tests for devflow amend command (dry-run paths only)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestRepo, type TestRepo } from "../helpers/git-fixture.js";
import { runDevflow, runDevflowOk } from "../helpers/cli-runner.js";

describe("amend command integration", () => {
  let repo: TestRepo;

  beforeEach(() => {
    repo = createTestRepo({ withConfig: true, withInitialCommit: true });
    // Add a commit to amend
    repo.commit("feat[123](core): add initial feature");
  });

  afterEach(() => {
    repo.cleanup();
  });

  it("dry-run exits 0 and prints [dry-run] message", () => {
    const stdout = runDevflowOk(
      ["amend", "--dry-run", "--type", "fix", "--scope", "core", "--message", "corrected message", "--yes"],
      repo.path
    );
    expect(stdout).toContain("[dry-run]");
    expect(stdout).toContain("No amend performed");
  });

  it("dry-run shows before/after preview", () => {
    const stdout = runDevflowOk(
      ["amend", "--dry-run", "--type", "fix", "--scope", "core", "--message", "corrected message", "--yes"],
      repo.path
    );
    expect(stdout).toContain("Before:");
    expect(stdout).toContain("After:");
  });

  it("dry-run does not modify the last commit message", () => {
    const before = repo.git("log -1 --format=%s");

    runDevflow(
      ["amend", "--dry-run", "--type", "fix", "--scope", "core", "--message", "changed message", "--yes"],
      repo.path
    );

    const after = repo.git("log -1 --format=%s");
    expect(after).toBe(before);
  });

  it("--yes skips all prompts when edit flags provided", () => {
    const result = runDevflow(
      ["amend", "--dry-run", "--message", "new message", "--yes"],
      repo.path
    );
    // Should not hang waiting for input
    expect(result.exitCode).toBe(0);
  });
});
