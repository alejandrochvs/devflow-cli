/**
 * Integration tests for devflow stash command (dry-run paths only)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestRepo, type TestRepo } from "../helpers/git-fixture.js";
import { runDevflow, runDevflowOk } from "../helpers/cli-runner.js";

describe("stash command integration", () => {
  let repo: TestRepo;

  beforeEach(() => {
    repo = createTestRepo({ withConfig: true, withInitialCommit: true });
  });

  afterEach(() => {
    repo.cleanup();
  });

  it("dry-run save exits 0 and prints [dry-run] message", () => {
    // Create an uncommitted change
    repo.createFile("dirty.txt", "uncommitted change");
    repo.git("add dirty.txt");

    const stdout = runDevflowOk(
      ["stash", "--dry-run", "--action", "save", "--message", "test stash", "--yes"],
      repo.path
    );
    expect(stdout).toContain("[dry-run]");
    expect(stdout).toContain("test stash");
  });

  it("dry-run save does not create an actual stash", () => {
    repo.createFile("dirty.txt", "uncommitted change");
    repo.git("add dirty.txt");

    runDevflow(
      ["stash", "--dry-run", "--action", "save", "--message", "test stash", "--yes"],
      repo.path
    );

    const stashList = repo.git("stash list");
    expect(stashList).toBe("");
  });

  it("exits with message when no changes to stash and no existing stashes", () => {
    const result = runDevflow(
      ["stash", "--action", "save", "--yes"],
      repo.path
    );
    // Should exit without crashing when there's nothing to stash
    expect(result.exitCode).toBe(0);
  });
});
