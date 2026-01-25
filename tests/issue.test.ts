import { describe, it, expect } from "vitest";

// Issue type definitions matching the command
const ISSUE_TYPES = [
  { value: "user-story", label: "User Story", labelColor: "feature", branchType: "feat" },
  { value: "bug", label: "Bug", labelColor: "bug", branchType: "fix" },
  { value: "task", label: "Task", labelColor: "task", branchType: "chore" },
  { value: "spike", label: "Spike", labelColor: "spike", branchType: "chore" },
  { value: "tech-debt", label: "Tech Debt", labelColor: "tech-debt", branchType: "refactor" },
];

describe("issue types", () => {
  it("has 5 scrum issue types", () => {
    expect(ISSUE_TYPES).toHaveLength(5);
  });

  it("maps user story to feat branch type", () => {
    const userStory = ISSUE_TYPES.find((t) => t.value === "user-story");
    expect(userStory?.branchType).toBe("feat");
    expect(userStory?.labelColor).toBe("feature");
  });

  it("maps bug to fix branch type", () => {
    const bug = ISSUE_TYPES.find((t) => t.value === "bug");
    expect(bug?.branchType).toBe("fix");
    expect(bug?.labelColor).toBe("bug");
  });

  it("maps task to chore branch type", () => {
    const task = ISSUE_TYPES.find((t) => t.value === "task");
    expect(task?.branchType).toBe("chore");
    expect(task?.labelColor).toBe("task");
  });

  it("maps spike to chore branch type", () => {
    const spike = ISSUE_TYPES.find((t) => t.value === "spike");
    expect(spike?.branchType).toBe("chore");
    expect(spike?.labelColor).toBe("spike");
  });

  it("maps tech-debt to refactor branch type", () => {
    const techDebt = ISSUE_TYPES.find((t) => t.value === "tech-debt");
    expect(techDebt?.branchType).toBe("refactor");
    expect(techDebt?.labelColor).toBe("tech-debt");
  });
});

describe("branch name generation", () => {
  function generateBranchName(
    branchType: string,
    issueNumber: string | null,
    description: string
  ): string {
    const ticketPart = issueNumber ? `#${issueNumber}` : "UNTRACKED";
    const kebab = description
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `${branchType}/${ticketPart}_${kebab}`;
  }

  it("generates branch with issue number", () => {
    const branch = generateBranchName("feat", "123", "Add user authentication");
    expect(branch).toBe("feat/#123_add-user-authentication");
  });

  it("generates branch without issue number", () => {
    const branch = generateBranchName("fix", null, "Fix login bug");
    expect(branch).toBe("fix/UNTRACKED_fix-login-bug");
  });

  it("kebab-cases the description", () => {
    const branch = generateBranchName("chore", "45", "Update Dependencies NOW!");
    expect(branch).toBe("chore/#45_update-dependencies-now");
  });

  it("handles special characters in description", () => {
    const branch = generateBranchName("refactor", "99", "Refactor API (v2)");
    expect(branch).toBe("refactor/#99_refactor-api-v2");
  });

  it("trims leading/trailing dashes from description", () => {
    const branch = generateBranchName("feat", "1", "---test feature---");
    expect(branch).toBe("feat/#1_test-feature");
  });
});

describe("issue body templates", () => {
  function generateUserStoryBody(
    asA: string,
    iWant: string,
    soThat: string,
    criteria: string[],
    notes?: string
  ): string {
    return `## User Story

**As a** ${asA}
**I want to** ${iWant}
**So that** ${soThat}

## Acceptance Criteria

${criteria.map((c) => `- [ ] ${c}`).join("\n")}
${notes ? `\n## Notes\n\n${notes}` : ""}`;
  }

  function generateBugBody(
    description: string,
    expected: string,
    steps: string[],
    environment?: string,
    logs?: string
  ): string {
    return `## Bug Report

### Description
${description}

### Expected Behavior
${expected}

### Steps to Reproduce
${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${environment ? `\n### Environment\n${environment}` : ""}
${logs ? `\n### Logs / Screenshots\n${logs}` : ""}`;
  }

  it("generates user story body with criteria", () => {
    const body = generateUserStoryBody(
      "logged-in user",
      "export my data",
      "I can use it offline",
      ["CSV format", "Includes all fields"]
    );
    expect(body).toContain("**As a** logged-in user");
    expect(body).toContain("**I want to** export my data");
    expect(body).toContain("**So that** I can use it offline");
    expect(body).toContain("- [ ] CSV format");
    expect(body).toContain("- [ ] Includes all fields");
  });

  it("generates user story body with notes", () => {
    const body = generateUserStoryBody(
      "admin",
      "manage users",
      "I can control access",
      ["Add users", "Remove users"],
      "Consider rate limiting"
    );
    expect(body).toContain("## Notes");
    expect(body).toContain("Consider rate limiting");
  });

  it("generates bug body with steps", () => {
    const body = generateBugBody(
      "Login fails",
      "Should redirect to dashboard",
      ["Go to login page", "Enter credentials", "Click submit"]
    );
    expect(body).toContain("### Description\nLogin fails");
    expect(body).toContain("### Expected Behavior\nShould redirect to dashboard");
    expect(body).toContain("1. Go to login page");
    expect(body).toContain("2. Enter credentials");
    expect(body).toContain("3. Click submit");
  });

  it("generates bug body with environment info", () => {
    const body = generateBugBody(
      "Crash on startup",
      "App should load",
      ["Open app"],
      "macOS 14, Chrome 120"
    );
    expect(body).toContain("### Environment\nmacOS 14, Chrome 120");
  });
});

describe("issue URL parsing", () => {
  function extractIssueNumber(url: string): string | null {
    const match = url.match(/\/issues\/(\d+)/);
    return match ? match[1] : null;
  }

  it("extracts issue number from GitHub URL", () => {
    const url = "https://github.com/owner/repo/issues/123";
    expect(extractIssueNumber(url)).toBe("123");
  });

  it("extracts issue number from URL with trailing content", () => {
    const url = "https://github.com/owner/repo/issues/456#issuecomment-789";
    expect(extractIssueNumber(url)).toBe("456");
  });

  it("returns null for non-issue URLs", () => {
    const url = "https://github.com/owner/repo/pulls/123";
    expect(extractIssueNumber(url)).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    const url = "not a url";
    expect(extractIssueNumber(url)).toBeNull();
  });
});
