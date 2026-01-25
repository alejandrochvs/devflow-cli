import { execSync } from "child_process";
import { yellow } from "../colors.js";

export interface Ticket {
  id: string;
  title: string;
  labels: string[];
  url?: string;
}

export interface TicketProvider {
  listOpen(options?: { assignee?: string }): Ticket[];
  getById(id: string): Ticket | undefined;
}

export interface TicketProviderConfig {
  type: string;
  [key: string]: unknown;
}

// Maps GitHub issue labels to branch types
export const LABEL_TO_BRANCH_TYPE: Record<string, string> = {
  bug: "fix",
  enhancement: "feat",
  feature: "feat",
  documentation: "docs",
  docs: "docs",
  refactor: "refactor",
  test: "test",
  testing: "test",
  chore: "chore",
  maintenance: "chore",
  dependencies: "chore",
  "tech-debt": "refactor",
  "tech debt": "refactor",
  spike: "chore",
  task: "chore",
};

export function inferBranchTypeFromLabels(labels: string[]): string | undefined {
  for (const label of labels) {
    const normalized = label.toLowerCase();
    if (LABEL_TO_BRANCH_TYPE[normalized]) {
      return LABEL_TO_BRANCH_TYPE[normalized];
    }
  }
  return undefined;
}

export class GitHubTicketProvider implements TicketProvider {
  listOpen(options?: { assignee?: string }): Ticket[] {
    try {
      const assigneeArg = options?.assignee ? `--assignee ${options.assignee}` : "--assignee @me";
      const cmd = `gh issue list ${assigneeArg} --state open --json number,title,labels,url --limit 50`;
      const output = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
      const issues = JSON.parse(output) as Array<{
        number: number;
        title: string;
        labels: Array<{ name: string }>;
        url: string;
      }>;

      return issues.map((issue) => ({
        id: String(issue.number),
        title: issue.title,
        labels: issue.labels.map((l) => l.name),
        url: issue.url,
      }));
    } catch (error) {
      // Soft fail - return empty array if gh command fails
      console.error(yellow("⚠ Could not fetch GitHub issues. Falling back to manual input."));
      return [];
    }
  }

  getById(id: string): Ticket | undefined {
    try {
      const cmd = `gh issue view ${id} --json number,title,labels,url`;
      const output = execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
      const issue = JSON.parse(output) as {
        number: number;
        title: string;
        labels: Array<{ name: string }>;
        url: string;
      };

      return {
        id: String(issue.number),
        title: issue.title,
        labels: issue.labels.map((l) => l.name),
        url: issue.url,
      };
    } catch {
      return undefined;
    }
  }
}

export function createTicketProvider(config?: TicketProviderConfig): TicketProvider | undefined {
  if (!config || !config.type) {
    return undefined;
  }

  switch (config.type) {
    case "github":
      return new GitHubTicketProvider();
    default:
      // Unknown provider type - plugins would register here
      console.error(yellow(`⚠ Unknown ticket provider type: "${config.type}"`));
      return undefined;
  }
}
