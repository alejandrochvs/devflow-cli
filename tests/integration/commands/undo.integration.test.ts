/**
 * Integration tests for devflow undo command (dry-run paths only)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestRepo, type TestRepo } from "../helpers/git-fixture.js";
import { runDevflow, runDevflowOk } from "../helpers/cli-runner.js";

describe("undo command integration", () => {
  let repo: TestRepo;

  beforeEach(() => {
    repo = createTestRepo({ withConfig: true, withInitialCommit: true });
    repo.commit("feat[123](core): add feature to undo");
  });

  afterEach(() => {
    repo.cleanup();
  });

  it("dry-run exits 0 and prints [dry-run] message", () => {
    const stdout = runDevflowOk(["undo", "--dry-run", "--yes"], repo.path);
    expect(stdout).toContain("[dry-run]");
    expect(stdout).toContain("No undo performed");
  });

  it("dry-run shows the commit that would be undone", () => {
    const stdout = runDevflowOk(["undo", "--dry-run", "--yes"], repo.path);
    expect(stdout).toContain("add feature to undo");
  });

  it("dry-run does not modify git history", () => {
    const commitsBefore = repo.git("log --oneline").split("\n").length;

    runDevflow(["undo", "--dry-run", "--yes"], repo.path);

    const commitsAfter = repo.git("log --oneline").split("\n").length;
    expect(commitsAfter).toBe(commitsBefore);
  });
});
