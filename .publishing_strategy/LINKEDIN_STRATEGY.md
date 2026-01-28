# devflow-cli LinkedIn Content Strategy

## Posting Schedule

- **Frequency:** 3x/week (Weeks 1-2), then 2x/week (Weeks 3-12)
- **Days:** Tuesday, Wednesday, Thursday
- **Time:** 8:00 AM Eastern Time (adjust to your local: UTC-5 = 7am COL/PER/ECU, UTC-3 = 10am ARG/CHL, UTC-6 = 7am MEX)
- **Why:** US hiring managers and engineering leads are most active Tuesday-Thursday mornings. Avoid Monday (inbox overload) and Friday (checked out).

## Rules for Every Post

1. **Link goes in the FIRST COMMENT**, never in the post body
2. First 2 lines are the hook — write them last, make them sharp
3. One idea per post — don't combine topics
4. End with a question or soft CTA to drive comments
5. Reply to EVERY comment within the first 60 minutes
6. Use 3-5 hashtags at the end, never inline
7. No walls of text — max 3 lines per paragraph, lots of whitespace
8. Write in first person, conversational tone

---

## WEEK 1 — Launch

---

### Day 1 (Tuesday) — Launch Post

**Goal:** Introduce the tool through a personal pain point.

**Media:** 30-45s terminal recording showing: `devflow branch` → `devflow commit` → `devflow pr` in one seamless flow. Use [vhs](https://github.com/charmbracelet/vhs) or [asciinema](https://asciinema.org) + convert to GIF/MP4. Keep the terminal font large (18px+), use a dark theme with good contrast.

**Post:**

```
I was mass writing git commands every day:

git checkout -b feat/PROJ-123_some-feature
git add .
git commit -m "feat[PROJ-123](auth): add login flow"
gh pr create --title "..." --body "..." --label feature --assignee @me

Every time I got the format wrong.
Every time the PR template was half-empty.
Every time I forgot the label.

So I built a CLI that handles the entire flow interactively.

One command for branches.
One command for commits.
One command for PRs.

It infers the ticket from the branch.
It suggests the scope from your staged files.
It fills the PR template automatically.

Open source, zero config to start.

I'll drop the link in the comments.

What's the most repetitive git task in your workflow?

#opensource #cli #git #developertools #devtools
```

**First comment:** "Here's the repo: [link] — and the docs: https://devflow.alejandrochaves.dev"

---

### Day 2 (Wednesday) — Problem Post: Branch Naming

**Goal:** Highlight one specific pain point that resonates with team leads.

**Media:** Screenshot or short GIF of the `devflow branch` interactive prompt showing type selection → ticket → description → preview.

**Post:**

```
"What's the branch naming convention again?"

I've asked this on every team I've joined.

Some use feat/description.
Some use feature/TICKET-description.
Some use name/ticket/description.
Nobody remembers which one.

I built an interactive branch creator that enforces ONE format:

type/TICKET_description

You pick the type.
You enter the ticket.
You type a description (auto-kebab-cased).

No more "let me check the wiki."
No more inconsistent branch names in the repo.

The format becomes muscle memory after 2 days.

Do you have a branch naming convention on your team? How do you enforce it?

#git #developerexperience #cleancode #cli #devtools
```

---

### Day 3 (Thursday) — Problem Post: Commit Messages

**Goal:** Relate to the universal pain of conventional commits.

**Media:** Terminal GIF showing the full `devflow commit` flow: file staging checkboxes → type selection → scope → subject → preview.

**Post:**

```
I can never remember the conventional commit format.

Is it feat(scope): message?
Or feat[ticket](scope): message?
Or Feat: scope - message?

And then there's the mental load:

- What type is this? feat? refactor? chore?
- What scope? Was it "auth" or "authentication"?
- Wait, what was the ticket number again?

I built a commit command that asks you each piece interactively.

It reads the ticket from your branch name.
It suggests scopes from your config (or your staged file paths).
It formats everything correctly.

You just answer questions. It writes the commit.

No more "git commit --amend" five times in a row.

What's your commit message strategy? Free-form or conventional?

#conventionalcommits #git #cli #developertools #productivity
```

---

## WEEK 2 — Core Value

---

### Day 4 (Tuesday) — Problem Post: PRs

**Goal:** Show the PR automation solving a real workflow bottleneck.

**Media:** Side-by-side image. Left: a typical empty/half-filled PR. Right: a devflow-generated PR with all sections filled. Use a screenshot from a real PR (can be from your own repo).

**Post:**

```
90% of the PRs I review have:

- Empty description
- No labels
- Wrong base branch
- No test plan
- "TODO" in the checklist

It's not laziness. It's friction.

Filling a PR template manually means:
Copy the ticket link. Check the right boxes. List the commits. Add labels. Set assignee.

Nobody wants to do that for every PR.

So I automated it.

One command reads your branch, collects your commits, infers labels, links the ticket, fills the template, and assigns you.

Draft by default. Ready for review when you say so.

The PR goes from empty to complete in 10 seconds.

What's the #1 thing you check on a PR before reviewing the code?

#pullrequests #codereview #git #developerexperience #devtools
```

---

### Day 5 (Wednesday) — "Why I Built This"

**Goal:** Personal story, builds connection. This is the emotional post.

**Media:** None (text-only posts can perform well when personal). Optionally a casual photo of your workspace.

**Post:**

```
I built a CLI tool and published it on npm.

Not because the world needed another dev tool.
But because I was mass wasting time on the same git tasks, every single day.

Here's what my workflow looked like 6 months ago:

1. Google "conventional commit format" (again)
2. Copy a branch name pattern from Slack (again)
3. Open the PR template, delete half of it, fill the rest poorly
4. Forget to add labels
5. Forget to link the ticket
6. Get a review comment about the commit format

I'm a solo dev on most projects.
Nobody was enforcing conventions except my own memory.

So I built the enforcement INTO the workflow.

Now I don't think about formats.
I answer prompts. The tool does the rest.

It's open source. It's called devflow.

If you work on side projects or small teams without strict tooling — this might save you the same headaches.

Link in the comments.

#buildinpublic #opensource #developertools #sideproject #git
```

---

### Day 6 (Thursday) — Feature: Release Flow

**Goal:** Show the release command as a power feature.

**Media:** Terminal GIF of `devflow release`: showing version detection → commit analysis → bump suggestion → changelog preview → tag + push + GitHub release.

**Post:**

```
My release process used to be:

1. Decide the version number
2. Update package.json
3. Write the changelog (by reading git log manually)
4. Commit the version bump
5. Create a git tag
6. Push the tag
7. Go to GitHub and create a release
8. Copy the changelog into the release body

8 steps. Easy to forget one.
Easy to mess up the tag format.
Easy to skip the changelog.

Now it's one command:

devflow release

It reads your commits since the last tag.
Suggests the right semver bump.
Generates the changelog grouped by type.
Commits, tags, pushes, and creates the GitHub release.

One command. Zero steps to forget.

What's your release process? Manual or automated?

#release #semver #git #automation #devtools
```

---

## WEEK 3 — Features & Depth

---

### Day 7 (Tuesday) — Feature: Scope Inference

**Goal:** Show intelligence behind the tool.

**Media:** Short GIF showing: stage a file in `src/auth/`, then `devflow commit` auto-suggesting the "auth" scope.

**Post:**

```
My CLI knows which scope to suggest based on what you staged.

Here's how it works:

You configure scopes with file path patterns:

{
  "scopes": [
    { "value": "auth", "paths": ["src/auth/**"] },
    { "value": "ui", "paths": ["src/components/**"] }
  ]
}

When you run the commit command:

1. It checks which files are staged
2. Matches them against scope patterns
3. Pre-selects the scope with the most matches

Stage src/auth/login.ts → suggests "auth"
Stage src/components/Button.tsx → suggests "ui"

No typing. No remembering. Just confirm.

It also falls back to your git history — if your last 3 commits on this branch used "api" scope, it suggests "api".

Small feature. Big time saver.

#cli #git #conventionalcommits #developerexperience #automation
```

---

### Day 8 (Thursday) — Feature: Monorepo Support

**Goal:** Appeal to the monorepo crowd (large audience).

**Media:** Diagram or code snippet showing how workspace packages become scopes automatically.

**Post:**

```
If you work in a monorepo, you don't need to configure scopes manually.

devflow auto-detects your workspace packages and uses them as commit scopes.

Works with:
- npm/yarn workspaces
- pnpm workspaces
- Lerna
- Nx
- Turborepo

In a repo with packages/auth and packages/ui:

Stage packages/auth/src/login.ts
→ Auto-suggests "auth" as the scope

Stage packages/ui/src/Button.tsx
→ Auto-suggests "ui" as the scope

Zero config. Just works.

Each package directory becomes a path pattern for scope inference.

For teams with 10+ packages, this means consistent commit history without a style guide nobody reads.

Are you in a monorepo? How do you handle commit scopes?

#monorepo #git #turborepo #nx #devtools
```

---

## WEEK 4

---

### Day 9 (Tuesday) — Technical Learning: Building a CLI

**Goal:** Educational content, positions you as a builder.

**Media:** Code snippet screenshot (dark theme, large font) showing the Commander.js + Inquirer stack. Maybe 10-15 lines of the core command registration.

**Post:**

```
I built a full CLI tool with just 2 npm packages:

commander — for command parsing and help text
@inquirer/prompts — for interactive selections

That's it. No framework. No boilerplate generator.

Here's what I learned:

1. Commander gives you commands, options, and aliases for free
2. Inquirer's checkbox prompt is perfect for file staging
3. TypeScript + Node 20 = top-level await + native ESM, no bundler needed
4. Git operations are just child_process.execSync calls — keep it simple
5. A plugin system is just "find packages, import them, call register(program)"

The entire CLI is ~3000 lines of TypeScript.
Ships as compiled JS. No runtime deps beyond commander and inquirer.

If you've thought about building a CLI — it's more approachable than you think.

What tools would you build if CLI development was easy?

#typescript #nodejs #cli #buildinpublic #opensource
```

---

### Day 10 (Thursday) — Feature: Cleanup Command

**Goal:** Relatable daily annoyance.

**Media:** Terminal GIF showing `devflow cleanup` finding stale branches and offering checkboxes to delete them.

**Post:**

```
I just ran "git branch" and counted 47 local branches.

Most were merged months ago.
Some were tracking remote branches that don't exist anymore.
A few I don't even remember creating.

Sound familiar?

devflow cleanup does this:

1. Fetches remote state
2. Finds branches merged into main
3. Finds branches tracking deleted remotes
4. Shows you a checkbox list
5. Deletes the ones you select

One command. Clean repo.

No more:
git branch -d feature/old-thing
git branch -d fix/that-bug
git branch -d chore/something
(x47)

How many dead branches do you have right now? Go check. I'll wait.

#git #productivity #cleancode #devtools #cli
```

---

## WEEK 5

---

### Day 11 (Tuesday) — Feature: Dry Run

**Goal:** Address the fear of automation ("what if it does something wrong?").

**Media:** Terminal screenshot showing `devflow commit --dry-run` output — previewing without executing.

**Post:**

```
"What if the tool does something I don't want?"

Fair question. Every command that modifies git state supports --dry-run.

devflow commit --dry-run → shows the commit message, doesn't commit
devflow branch --dry-run → shows the branch name, doesn't create it
devflow pr --dry-run → shows the PR body, doesn't open it
devflow release --dry-run → shows the changelog and tag, doesn't push

Preview everything. Execute nothing.

When you're confident, remove the flag.

I use dry-run myself before every release.
Trust your tools, but verify first.

Do you use dry-run flags? Or do you live dangerously?

#cli #git #devtools #bestpractices #automation
```

---

### Day 12 (Thursday) — Feature: Shareable Configs

**Goal:** Appeal to team leads managing multiple repos.

**Media:** Code snippet showing `extends` in .devflow/config.json + the base config package structure.

**Post:**

```
I manage the same git conventions across 12 repositories.

Updating the commit format in each one?
Changing the PR checklist in each one?
Adding a new scope to each one?

No.

devflow supports shareable configs:

{
  "extends": "@myorg/devflow-config",
  "ticketBaseUrl": "https://jira.myorg.com/browse"
}

The base config lives in one npm package.
Each repo extends it with local overrides.

Change the base → all repos get the update on next install.

Same pattern as ESLint, Prettier, and commitlint.

If your team has more than 3 repos with similar conventions — centralize the config.

How do you share conventions across repositories?

#configuration #monorepo #devtools #bestpractices #teamwork
```

---

## WEEK 6

---

### Day 13 (Tuesday) — Educational: Conventional Commits

**Goal:** Teach something useful, mention devflow naturally.

**Media:** Infographic-style image showing the conventional commit format with labeled parts: type, scope, breaking, subject, body, footer.

**Post:**

```
Conventional commits in 60 seconds:

Format: type(scope): subject

Types:
- feat → new feature (bumps minor)
- fix → bug fix (bumps patch)
- chore → maintenance (no bump)
- refactor → code change, no behavior change
- docs → documentation only
- test → adding/fixing tests

Scope = what area of the code you touched (auth, ui, api)

Breaking changes? Add ! after scope:
feat(api)!: remove deprecated endpoints

Why bother?

1. Auto-generate changelogs
2. Auto-determine version bumps
3. Readable git history
4. Enforce with commitlint

The hard part isn't the format — it's remembering it every time.

That's why I built a CLI that asks you each piece interactively.
You answer questions. It writes the commit.

Do you use conventional commits? What convinced you (or what's stopping you)?

#conventionalcommits #git #semver #changelog #devtools
```

---

### Day 14 (Thursday) — Feature: Review Command

**Goal:** Show devflow as a team tool, not just solo.

**Media:** Terminal GIF showing `devflow review`: listing PRs → selecting one → diff stat → choosing "approve" or "checkout".

**Post:**

```
Code review from the terminal:

devflow review

1. Lists open PRs (author, title, status)
2. Select one to inspect
3. See the diff stat summary
4. Choose: checkout, approve, comment, request changes, or open in browser

No switching to the browser.
No loading GitHub.
No losing your terminal context.

I use this when I'm already deep in the codebase and someone pings me for a review.

Stay in the flow. Review in the terminal. Move on.

Where do you do your code reviews? Browser or terminal?

#codereview #git #productivity #cli #devtools
```

---

## WEEK 7

---

### Day 15 (Tuesday) — Feature: Worktrees

**Goal:** Introduce a lesser-known git feature through devflow.

**Media:** Terminal GIF of `devflow worktree` adding a new worktree and showing the list.

**Post:**

```
Most devs don't know about git worktrees.

The problem: you're mid-feature, someone needs a hotfix review.

Option A: stash everything, switch branches, lose context.
Option B: clone the repo again.
Option C: git worktrees.

Worktrees let you have multiple branches checked out in DIFFERENT directories. Simultaneously.

devflow worktree makes it interactive:

- Add → creates a worktree (auto-creates branch if needed)
- Remove → select and clean up (force option for dirty trees)
- List → shows all worktrees with current one highlighted

Context switch without losing your work.
No stashing. No extra clones.

Have you used git worktrees before?

#git #productivity #tips #devtools #cli
```

---

### Day 16 (Thursday) — Feature: Plugin System

**Goal:** Show extensibility, attract potential contributors.

**Media:** Code snippet (10 lines) showing a minimal plugin that adds a "deploy" command.

**Post:**

```
devflow is extensible via plugins.

10 lines of code to add a custom command:

import { Command } from "commander";

export function register(program: Command): void {
  program
    .command("deploy")
    .description("Deploy the current branch")
    .action(() => {
      // your logic
    });
}

Publish as devflow-plugin-deploy on npm.
It's auto-discovered. Zero config.

Or list it explicitly:

{
  "plugins": ["devflow-plugin-deploy"]
}

The plugin receives the full Commander instance.
Add commands, options, hooks — whatever you need.

What custom git workflow would you automate if you could?

#opensource #plugins #cli #typescript #devtools
```

---

## WEEK 8

---

### Day 17 (Tuesday) — Educational: PR Templates

**Goal:** Opinionated take, drives engagement through disagreement.

**Media:** Screenshot of a well-filled PR template (generated by devflow) with all sections visible.

**Post:**

```
Your PR template probably has too many sections.

Here's what actually gets read:

1. Summary — 2-3 lines of what changed and why
2. Test plan — how to verify this works

That's it. That's what reviewers need.

Here's what usually gets ignored:
- Screenshots (unless it's UI)
- Related issues (just link in the commit)
- Checklist with 15 items nobody reads

My PR template uses 6 sections but auto-fills 4 of them:
- Summary → from commit messages
- Ticket → from branch name
- Type → from branch prefix
- Labels → from commits

The dev only writes the summary and test plan.
Everything else is inferred.

Friction removed → better PRs.

What's in your PR template? Too much or too little?

#pullrequests #codereview #bestpractices #git #teamwork
```

---

### Day 18 (Thursday) — Feature: Stats Command

**Goal:** Fun/visual content, easy engagement.

**Media:** Terminal screenshot of `devflow stats` output showing the bar charts, top scopes, contributors, and summary.

**Post:**

```
I ran analytics on my commit history:

devflow stats

And I found out:

- 43% of my commits are "chore" (yikes)
- My top scope is "deps" (double yikes)
- I've made 847 commits since January
- Most active day: Thursday (makes sense)

It shows:
- Commit type distribution (with bar charts)
- Top scopes
- Contributors
- Total commits, branches, first commit date

It's not essential. But it's fun.

And it tells you if your commit history is actually conventional or just chaos.

Run it on your repo. What's your most common commit type?

#git #analytics #developerexperience #fun #devtools
```

---

## WEEK 9

---

### Day 19 (Tuesday) — Feature: Doctor Command

**Goal:** Show the "batteries included" setup experience.

**Media:** Terminal screenshot of `devflow doctor` output with checkmarks and X marks.

**Post:**

```
"Works on my machine" but for your git setup:

devflow doctor

Checks:
✓ git installed
✓ node >= 20
✓ gh CLI installed and authenticated
✓ .devflow/config.json exists and valid
✓ commitlint config present
✓ husky hooks configured
✓ package.json scripts set up

One command tells you if your project is fully set up.

New team member? Run doctor.
Something broke after an update? Run doctor.
CI failing on commit hooks? Run doctor.

No more "did you install husky?"
No more "is your node version right?"

Does your project have a health check command?

#dx #developerexperience #onboarding #devtools #cli
```

---

### Day 20 (Thursday) — Milestone / Engagement Post

**Goal:** Drive engagement, collect feature ideas.

**Media:** None (text-only).

**Post:**

```
I launched devflow 3 weeks ago.

Here's what happened:

- [X] stars on GitHub
- [X] npm downloads
- [X] people messaged me about it
- 4 feature requests I didn't expect

The most requested feature?
[Fill in based on actual feedback]

Building in public means your roadmap is shaped by real users, not assumptions.

I'm planning the next version. Here's what's on my radar:

- [ ] Feature A
- [ ] Feature B
- [ ] Feature C

What would YOU want a git workflow CLI to do that doesn't exist yet?

Drop your ideas below. Best one gets implemented this week.

#buildinpublic #opensource #community #devtools #git
```

---

## WEEK 10

---

### Day 21 (Tuesday) — Technical: Git Merge-Base Trick

**Goal:** Educational, shows depth of the tool.

**Media:** Terminal showing the git merge-base command output + how devflow uses it.

**Post:**

```
How does devflow know which branch to target for your PR?

It doesn't guess. It uses git merge-base.

The algorithm:

1. List all remote branches
2. For each, run: git merge-base --is-ancestor HEAD origin/branch
3. Find the closest ancestor by commit count
4. That's your base branch

Why this matters:

If you branched from "develop" (not main), devflow targets "develop."
If you branched from a feature branch, it targets that feature branch.

No more accidentally opening PRs against main when you meant develop.

No more manually typing --base every time.

The tool infers it. You confirm it.

Small detail. Prevents real problems.

#git #tips #automation #devtools #cli
```

---

### Day 22 (Thursday) — Feature: Init Wizard

**Goal:** Lower the barrier to trying the tool.

**Media:** Full terminal recording (60s) of `devflow init` walking through all steps.

**Post:**

```
From zero to fully configured in one command:

npx devflow init

The wizard sets up:

1. Ticket base URL (for PR links)
2. Commit scopes (one by one or defaults)
3. PR checklist (customize or use defaults)
4. package.json scripts (commit, branch, pr)
5. Commitlint config (with devflow's parser preset)
6. Husky hooks (commit-msg + optional pre-push)
7. CI workflow (lint, typecheck, test)

That's 7 things you'd normally configure separately.
Reading 4 different docs.
Installing 6 different packages.
Creating 5 different config files.

Or: one command, answer some questions, done.

try it: npx devflow init

What's the longest project setup you've done?

#dx #developerexperience #cli #productivity #devtools
```

---

## WEEK 11

---

### Day 23 (Tuesday) — Feature: Log with Actions

**Goal:** Show power-user features.

**Media:** Terminal GIF of `devflow log` → selecting a commit → choosing "cherry-pick" action.

**Post:**

```
git log is read-only. I wanted it to be interactive.

devflow log:

1. Shows commits on your branch (since diverging from base)
2. Select any commit
3. See details + file stats
4. Choose an action:
   - Cherry-pick to another branch
   - Revert it
   - Create a fixup for it
   - View the full diff

It's git log + git cherry-pick + git revert in one interface.

No copying commit hashes.
No "wait, was it --no-commit or --no-edit?"

Select. Act. Done.

How do you navigate your commit history?

#git #productivity #cli #devtools #developerexperience
```

---

### Day 24 (Thursday) — Educational: Fixup Commits

**Goal:** Teach something many devs don't use.

**Media:** Terminal GIF showing `devflow fixup` selecting a commit and auto-squashing.

**Post:**

```
Most devs don't know about fixup commits.

The problem: you pushed 5 commits. The reviewer found a typo in commit #2.

Option A: new commit "fix typo" (clutters history)
Option B: interactive rebase (scary, error-prone)
Option C: fixup commit

A fixup commit automatically squashes into the target commit during rebase.

git commit --fixup=<hash>
git rebase -i --autosquash

But who remembers the hash? Who types --autosquash?

devflow fixup:

1. Shows recent commits
2. You pick which one to fix
3. Stage your files
4. Optionally auto-squashes immediately

Clean history. No hash copying. No rebase anxiety.

Do you squash your PRs or keep individual commits?

#git #tips #cleancode #productivity #devtools
```

---

## WEEK 12

---

### Day 25 (Tuesday) — Feature: Shell Completions

**Goal:** Quality-of-life feature, shows polish.

**Media:** Terminal GIF showing tab completion of devflow commands.

**Post:**

```
Small detail that makes a CLI feel professional:

Tab completion.

devflow com<TAB> → devflow commit
devflow b<TAB> → devflow branch
devflow re<TAB> → devflow release / review

Setup (one line in your shell config):

# zsh
eval "$(devflow completions --shell zsh)"

# bash
eval "$(devflow completions --shell bash)"

Takes 10 seconds to set up.
Saves 10 seconds every time you use the tool.

It's the kind of thing you don't notice until it's gone.

Do you set up shell completions for your CLI tools?

#cli #terminal #productivity #devtools #tips
```

---

### Day 26 (Thursday) — Docs Site Announcement

**Goal:** Drive traffic to the docs site.

**Media:** Screenshot of the landing page at devflow.alejandrochaves.dev (hero section + features).

**Post:**

```
I gave my CLI tool a proper documentation site.

devflow.alejandrochaves.dev

Built with VitePress (same as Vue.js docs).
Deployed to GitHub Pages.
Auto-deploys on every push.

It has:
- Landing page with feature overview
- Getting started guide
- Individual page per command (20 commands)
- Configuration reference
- Plugin authoring guide
- Full-text search

Why bother with docs for a side project?

Because README.md hits a limit.
Because people don't read a 500-line README.
Because separate pages are searchable and linkable.

And because building the docs forced me to write clear descriptions for every feature.

If you maintain an open source project — when did you know you needed a docs site?

#opensource #documentation #vitepress #devtools #buildinpublic
```

---

## WEEKS 13-16 — Ongoing Cadence (2x/week)

Continue alternating between:

---

### Day 27 — Before/After Carousel

**Media:** LinkedIn carousel (PDF upload), 5-6 slides:
1. Cover: "Git workflow: before vs after devflow"
2. Branch: manual typing vs interactive prompt
3. Commit: remembering format vs guided builder
4. PR: empty template vs auto-filled
5. Release: 8 manual steps vs one command
6. CTA: "Link in comments"

---

### Day 28 — "5 Git Commands You Run Manually"

**Post theme:** List 5 tedious git operations, show the devflow equivalent for each. Quick-hit format.

---

### Day 29 — Engagement: "Your Worst Git Mistake"

**Post theme:** Share your own worst git mistake (force push to main, wrong rebase, etc.), ask others to share. Low-effort high-engagement.

---

### Day 30 — Feature: Branch Protection Warning

**Post theme:** "devflow stops you before committing to main." Short post about the branch protection prompt.

---

### Day 31 — Download/Star Milestone

**Post theme:** Share a real milestone number. Keep it humble and grateful.

---

### Day 32 — "What I'd Do Differently"

**Post theme:** Retrospective on building the tool. Architecture decisions you'd change. Honest and educational.

---

## Media Production Guide

### Terminal Recordings (GIF/MP4)

**Tool:** [vhs](https://github.com/charmbracelet/vhs) (recommended) or asciinema

**VHS tape file example:**

```
Output demo.gif
Set FontSize 18
Set Width 900
Set Height 500
Set Theme "Catppuccin Mocha"

Type "devflow branch"
Enter
Sleep 1s
Down
Enter
Sleep 500ms
Type "ENV-123"
Enter
Sleep 500ms
Type "add user authentication"
Enter
Sleep 1s
Enter
Sleep 2s
```

**Rules:**
- Max 45 seconds
- Font size 18+ (readable on mobile)
- Dark theme with good contrast
- Pause on important output (2-3s)
- No mistakes/backspacing (re-record if needed)
- End on the final result visible for 3s

### Screenshots

- Use a clean terminal with no distracting tabs
- Crop tight — no extra whitespace
- Dark theme (Catppuccin, Dracula, or One Dark)
- If showing code, use a tool like [ray.so](https://ray.so) or [carbon.now.sh](https://carbon.now.sh)
- Resolution: at least 1200x630px (LinkedIn recommended)

### Carousels (PDF)

- Create in Figma, Canva, or Keynote
- Export as PDF (LinkedIn auto-paginates)
- 5-8 slides max
- Large text (readable without zooming)
- One idea per slide
- Strong cover slide (this shows in the feed)
- Last slide: CTA + your handle

---

## Hashtag Strategy

**Primary (use on every post):** #devtools #git

**Rotate 3 from these based on topic:**
- #opensource
- #cli
- #typescript
- #buildinpublic
- #developerexperience
- #productivity
- #conventionalcommits
- #codereview
- #automation
- #nodejs
- #cleancode
- #monorepo

**Never more than 5 hashtags per post.**

---

## Engagement Strategy

1. **First 60 minutes are critical** — stay online and reply to every comment
2. **Ask a question at the end of every post** — drives comments
3. **Reply with substance** — not just "thanks!", add value or ask a follow-up
4. **Tag people who might relate** — but sparingly (1-2 per post max)
5. **Engage on others' posts** in the dev community daily — gives you feed visibility
6. **Repost with a comment** if someone shares your tool — amplifies reach

---

## Metrics to Track

| Week | Goal |
|------|------|
| 1-2 | 1000+ impressions per post, 20+ reactions |
| 3-4 | 2000+ impressions, 50+ reactions, first inbound messages |
| 5-8 | Consistent 3000+ impressions, GitHub stars growing |
| 9-12 | 5000+ impressions, people sharing organically |

Adjust frequency and content based on which posts perform best. Double down on the format that works.
