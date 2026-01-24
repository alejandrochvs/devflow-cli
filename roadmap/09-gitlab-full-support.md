# GitLab Full Support (Core Refactor)

## Priority: Medium-High
## Status: Planned
## Release: 0.7.0

## Overview

Refactor the core to abstract all GitHub-specific operations behind a `GitHost` interface, then implement a `GitLabHost` using `glab` CLI. This enables devflow to work natively with GitLab repositories — not just for ticket tracking, but for the entire PR/MR, review, release, and comments workflow.

## Current State

- 13 commands are pure git (work with any remote today)
- 7 commands use `gh` CLI (25 total invocations across 8 files)
- All `gh` commands have near-1:1 `glab` equivalents

## Architecture

### GitHost Interface

```typescript
// src/providers/git-host.ts

export interface PrInfo {
  number: number;
  title: string;
  url: string;
  state?: string;
  headRefName?: string;
  author?: string;
  additions?: number;
  deletions?: number;
  reviewDecision?: string;
}

export interface CreatePrOpts {
  title: string;
  body: string;
  base: string;
  head: string;
  draft: boolean;
  assignee?: string;
  labels?: string[];
  reviewers?: string[];
}

export interface ReviewThread {
  isResolved: boolean;
  path: string;
  line: number | null;
  diffHunk: string;
  comments: { author: string; body: string; createdAt: string }[];
}

export interface Review {
  author: string;
  state: string;
  body: string;
  submittedAt: string;
}

export interface GitHost {
  name: "github" | "gitlab";

  // Installation & auth
  checkInstalled(): void;
  checkAuth(): boolean;

  // PR/MR operations
  createPr(opts: CreatePrOpts): PrInfo;
  updatePr(number: number, opts: { title?: string; body?: string }): void;
  getPrForBranch(branch?: string): PrInfo | undefined;
  listOpenPrs(): PrInfo[];
  mergePr(number: number, method: string, deleteBranch: boolean): void;
  getPrDiffStat(number: number): string;
  checkoutPr(number: number): void;
  openPrInBrowser(number: number): void;

  // Review operations
  approvePr(number: number, body?: string): void;
  commentOnPr(number: number, body: string): void;
  requestChanges(number: number, body: string): void;
  getReviewThreads(number: number): ReviewThread[];
  getReviews(number: number): Review[];

  // Labels
  ensureLabel(name: string, color: string): void;

  // Releases
  createRelease(tag: string, title: string, notes: string): void;

  // Repo info
  getRepoInfo(): { owner: string; repo: string } | undefined;
}
```

### Auto-Detection

```typescript
// src/providers/detect-host.ts

export function detectGitHost(config?: DevflowConfig): GitHost {
  // 1. Config override takes priority
  if (config?.gitHost === "gitlab") return new GitLabHost();
  if (config?.gitHost === "github") return new GitHubHost();

  // 2. Auto-detect from remote URL
  const remoteUrl = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();

  if (remoteUrl.includes("gitlab.com") || remoteUrl.includes("gitlab")) {
    return new GitLabHost();
  }

  // Default to GitHub
  return new GitHubHost();
}
```

### Config Addition

```json
{
  "gitHost": "gitlab"
}
```

Optional — auto-detection handles most cases. Config override useful for self-hosted instances.

## Implementation Phases

### Phase 1: Extract GitHost Interface + GitHubHost

**Files to modify:**
- `src/providers/git-host.ts` (NEW) — Interface definition
- `src/providers/github-host.ts` (NEW) — Extract all `gh` calls into class
- `src/providers/detect-host.ts` (NEW) — Auto-detection logic
- `src/git.ts` — Remove `checkGhInstalled()`, move to GitHubHost
- `src/commands/pr.ts` — Replace inline `gh` calls with `host.createPr()`, etc.
- `src/commands/review.ts` — Replace with `host.listOpenPrs()`, `host.approvePr()`, etc.
- `src/commands/comments.ts` — Replace with `host.getReviewThreads()`, `host.getReviews()`
- `src/commands/merge.ts` — Replace with `host.getPrForBranch()`, `host.mergePr()`
- `src/commands/release.ts` — Replace with `host.createRelease()`
- `src/commands/status.ts` — Replace with `host.getPrForBranch()`
- `src/commands/doctor.ts` — Replace with `host.checkInstalled()`, `host.checkAuth()`
- `src/config.ts` — Add `gitHost?: "github" | "gitlab"` to interface

**Goal:** Zero behavior change for GitHub users. All existing tests pass.

### Phase 2: Implement GitLabHost

**Files to create:**
- `src/providers/gitlab-host.ts` (NEW)

**Command mapping:**

| GitHubHost | GitLabHost |
|------------|-----------|
| `gh pr create --draft` | `glab mr create --draft` |
| `gh pr edit N --title --body-file` | `glab mr update N --title --description` |
| `gh pr view --json` | `glab mr view --output json` |
| `gh pr list --state open --json` | `glab mr list --state opened` |
| `gh pr merge N --squash` | `glab mr merge N --squash` |
| `gh pr diff N --stat` | `glab mr diff N --stat` |
| `gh pr checkout N` | `glab mr checkout N` |
| `gh pr review N --approve` | `glab mr approve N` |
| `gh pr comment N --body` | `glab mr comment N --message` |
| `gh pr view N --web` | `glab mr view N --web` |
| `gh label create` | `glab label create` |
| `gh release create` | `glab release create` |
| `gh repo view --json owner,name` | `glab repo view --output json` |

### Phase 3: Comments GraphQL for GitLab

GitLab's GraphQL schema for MR discussions differs from GitHub:

```graphql
query {
  project(fullPath: "owner/repo") {
    mergeRequest(iid: "142") {
      discussions(first: 100) {
        nodes {
          resolved
          notes(first: 20) {
            nodes {
              author { username }
              body
              createdAt
              position {
                filePath
                newLine
                diffRefs { headSha baseSha }
              }
            }
          }
        }
      }
    }
  }
}
```

Key differences:
- GitHub: `reviewThreads` → GitLab: `discussions`
- GitHub: `isResolved` → GitLab: `resolved`
- GitHub: `path` + `line` → GitLab: `position.filePath` + `position.newLine`
- GitHub: `diffHunk` available directly → GitLab: need to reconstruct from `diffRefs`
- GitHub: `author.login` → GitLab: `author.username`

### Phase 4: Auto-Detection + Doctor

- Parse `git remote get-url origin` for host detection
- `devflow doctor` checks for the correct CLI (`gh` or `glab`) based on detected host
- Provide clear error messages: "This is a GitLab repo. Install glab: brew install glab"

### Phase 5: Terminology Adaptation

| GitHub Term | GitLab Term | Shown to User |
|-------------|-------------|---------------|
| Pull Request | Merge Request | MR (on GitLab) |
| PR #N | MR !N | Adapted per host |
| `--assignee @me` | `--assignee @me` | Same |
| Draft | Draft | Same |

Output messages adapt:
- GitHub: "✓ Created PR #142"
- GitLab: "✓ Created MR !142"

## Testing Strategy

1. All existing tests pass unchanged (GitHub behavior preserved)
2. Mock `glab` commands in new GitLab-specific tests
3. Integration test: run `devflow pr --dry-run` on a GitLab repo
4. Auto-detection test: parse various remote URL formats

## Self-Hosted Instances

For self-hosted GitLab/GitHub Enterprise:

```json
{
  "gitHost": "gitlab"
}
```

Auto-detection works for URLs containing "gitlab" in the hostname. For ambiguous URLs (e.g., `git.company.com`), the config override is required.

## Verification

1. `devflow pr` creates MRs on GitLab repos via `glab`
2. `devflow review` lists and interacts with MRs
3. `devflow comments` shows resolved/unresolved on GitLab MRs
4. `devflow merge` merges MRs with squash/merge/rebase
5. `devflow release` creates GitLab releases
6. `devflow doctor` checks for `glab` on GitLab repos
7. Auto-detection picks the right host from remote URL
8. Config override works for self-hosted instances
9. All GitHub functionality remains unchanged
