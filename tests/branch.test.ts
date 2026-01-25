import { describe, it, expect } from "vitest";
import { formatBranchName } from "../src/commands/branch.js";

describe("formatBranchName", () => {
  it("formats standard branch with ticket", () => {
    const result = formatBranchName("{type}/{ticket}_{description}", {
      type: "feat",
      ticket: "ENV-123",
      description: "add-login",
    });
    expect(result).toBe("feat/ENV-123_add-login");
  });

  it("formats simple branch without ticket", () => {
    const result = formatBranchName("{type}/{description}", {
      type: "fix",
      description: "bug-fix",
    });
    expect(result).toBe("fix/bug-fix");
  });

  it("handles UNTRACKED ticket", () => {
    const result = formatBranchName("{type}/{ticket}_{description}", {
      type: "chore",
      ticket: "UNTRACKED",
      description: "update-deps",
    });
    expect(result).toBe("chore/UNTRACKED_update-deps");
  });

  it("handles issue number format", () => {
    const result = formatBranchName("{type}/{ticket}_{description}", {
      type: "feat",
      ticket: "#42",
      description: "new-feature",
    });
    expect(result).toBe("feat/#42_new-feature");
  });

  it("cleans up double slashes when ticket is empty", () => {
    const result = formatBranchName("{type}/{ticket}/{description}", {
      type: "feat",
      ticket: "",
      description: "login",
    });
    expect(result).toBe("feat/login");
  });

  it("cleans up double underscores", () => {
    const result = formatBranchName("{type}/{ticket}__{description}", {
      type: "feat",
      ticket: "",
      description: "login",
    });
    expect(result).toBe("feat/login");
  });

  it("removes leading and trailing underscores", () => {
    const result = formatBranchName("{type}/_{ticket}_{description}", {
      type: "feat",
      ticket: "",
      description: "login",
    });
    expect(result).toBe("feat/login");
  });

  it("removes leading and trailing slashes", () => {
    const result = formatBranchName("/{type}/{description}/", {
      type: "feat",
      description: "login",
    });
    expect(result).toBe("feat/login");
  });

  it("handles scope placeholder", () => {
    const result = formatBranchName("{type}/{scope}/{description}", {
      type: "feat",
      scope: "auth",
      description: "login",
    });
    expect(result).toBe("feat/auth/login");
  });

  it("cleans up when scope is empty", () => {
    const result = formatBranchName("{type}/{scope}/{description}", {
      type: "feat",
      description: "login",
    });
    expect(result).toBe("feat/login");
  });
});
