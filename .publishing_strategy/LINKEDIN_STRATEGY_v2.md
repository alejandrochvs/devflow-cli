# devflow-cli LinkedIn Content Strategy v2.0

**Last Updated:** January 27, 2026  
**Plan Version:** 2.0 (Updated from v1.0)  
**Status:** Ready to Deploy

---

## What Changed Since v1.0

The CLI has evolved significantly:

### Features Added (Not in Original Plan)
- ✅ **Issues command** — GitHub Projects v2 integration (NEW)
- ✅ **Comments command** — Show PR reviews + inline comments with diff context (NEW)
- ✅ **Update command** — Self-update capability with version tracking (NEW)
- ✅ **Non-interactive flags** — All commands support flags for AI agents + scripting (NEW)
- ✅ **Undo, fixup, merge, test-plan commands** — Advanced workflow features (NEW)
- ✅ **Branch protection warnings** — Prevents commits to main/develop (NEW)
- ✅ **Monorepo awareness** — Auto-detects workspace packages as scopes (EXPANDED)
- ✅ **Shareable configs** — Extends field for npm packages (EXPANDED)
- ✅ **Documentation site** — VitePress-powered docs at devflow.alejandrochaves.dev (LIVE)

### Plugin Roadmap (Still Planned)
- Jira, Linear, Azure DevOps, GitLab, Shortcut, Trello, Notion ticket providers

---

## Updated Positioning

**Old:** "Interactive CLI for branch creation, conventional commits, and PR management"

**New (Better):** "The complete git workflow CLI — from branch to PR to review to release, with AI-friendly non-interactive modes for automation"

**Why:** The tool is much more than basic workflow now. It's a full git companion with advanced features.

---

## Revised Content Calendar (12 Weeks, 24 Posts)

### Core Strategy (Same as v1)
- 3x/week weeks 1-2, then 2x/week weeks 3-12
- Link in first comment, never in body
- One idea per post, ask a question, reply to all comments in first 60 min
- Hashtags: #devtools, #git + 3 rotating
- First person, conversational tone

---

## WEEK 1 — Launch/Reposition

---

### Day 1 (Tuesday) — Updated Launch Post

**Media:** Terminal recording showing the FULL workflow (30-45s):
`devflow branch` → `devflow commit` → `devflow pr` → `devflow comments` → `devflow merge`

**Post:**

```
I wrote a CLI that handles the entire git workflow.

Not just the basics:

git checkout -b feat/...
git commit -m "..."
gh pr create ...

But the stuff that usually takes extra steps:

1. Create a branch (auto-formats, prevents main)
2. Stage and commit (conventional format)
3. Open a PR (auto-filled template)
4. View review comments inline (without switching tabs)
5. Merge with one command (squash/rebase/merge your choice)

One tool. Five operations. Zero context switching.

Works solo or in teams.
Supports traditional git or monorepos.
Scriptable for CI/CD (non-interactive flags on everything).

Open source. Type-safe. Zero runtime dependencies beyond commander + inquirer.

Link in comments.

What's the most annoying git step in your workflow?

#git #cli #opensource #devtools #productivity
```

**First comment:** "GitHub: [link] | Docs: devflow.alejandrochaves.dev | npm: @alejandrochaves/devflow-cli"

---

### Day 2 (Wednesday) — The GitHub Issues Integration (NEW)

**Media:** Terminal GIF showing `devflow issues` → selecting a GitHub Project card → converting it to a PR.

**Post:**

```
I added GitHub Projects integration to devflow.

Now you can:

devflow issues
→ Shows your open GitHub Projects cards
→ Select one
→ Auto-creates a branch with the issue ID
→ Codes + commits
→ Opens PR linked to the issue

Your issue tracker feeds directly into your workflow.
No copying IDs. No searching for the issue again.

Works with GitHub Projects v2 (the new one everyone's confused about).

This is the missing link between project management and your code.

Do you use GitHub Projects? Or do you stick with GitHub Issues?

#github #gitprojects #cli #productivity #devtools
```

---

### Day 3 (Thursday) — The Comments Command (NEW)

**Media:** Terminal GIF of `devflow comments` showing a PR with inline comments + diff context.

**Post:**

```
Your code review feedback is scattered:

- Some comments are on the PR description
- Some are threaded under specific commits
- Some are resolved, some are unresolved
- You have to load GitHub and scroll to find them

devflow comments fixes this.

Run it. See all the feedback on your PR in one terminal view:
- Unresolved comments (threaded properly)
- Diff context (what line is it talking about?)
- Author and timestamp
- One command to resolve them all

No opening the browser.
No losing context.

Stay in your editor. Address feedback in the terminal.

Do you ever miss review comments because they got buried in GitHub?

#codereview #git #productivity #cli #devtools
```

---

## WEEK 2 — Core Features (Enhanced)

---

### Day 4 (Tuesday) — Advanced: Fixup Commits

**Media:** Terminal GIF showing `devflow fixup` auto-squashing into earlier commits.

**Post:**

```
Fixup commits are underrated.

The scenario: reviewer finds a typo in commit 3 of your 5-commit PR.

Old way: create a new commit, rebase, mark as fixup manually.
New way: devflow fixup

1. Select which commit to fix
2. Stage your files
3. Done — it auto-squashes on push

The commit message is auto-generated (fixup! original message).
The auto-squash happens invisibly during rebase.
Your history stays clean without the mental overhead.

It's a 3-letter command for what used to be 3 git commands.

Do you ever create "fix typo" commits that clutter your PR history?

#git #conventionalcommits #productivity #cli #cleangit
```

---

### Day 5 (Wednesday) — Advanced: Undo Command

**Media:** Terminal GIF showing `devflow undo` soft-resetting the last commit with prompts.

**Post:**

```
git reset --soft HEAD~1

That command is muscle memory for every dev.

devflow undo makes it:
- Confirm which commit you're undoing
- Preview what you're unstaging
- One keystroke

But here's the real win: you never have to remember the flag.

Is it --soft or --hard?
Is it HEAD~1 or HEAD?
Is it @{-1}?

No. You just run devflow undo.

The tool knows you want to undo, not wipe history.
The tool knows you want to keep the changes staged.

Small thing. Prevents `git push --force` panics.

How many times have you used git reset and forgotten the flags?

#git #productivity #cli #devtools #safety
```

---

### Day 6 (Thursday) — Monorepo Power-Up (EXPANDED)

**Media:** Code snippet or diagram showing workspace packages auto-becoming scopes.

**Post:**

```
If you work in a monorepo (npm, pnpm, yarn, lerna, nx, turborepo):

devflow auto-detects your workspace packages and uses them as commit scopes.

Example:
Repo has: packages/auth, packages/api, packages/ui

Stage files from packages/auth → scope is "auth"
Stage files from packages/api → scope is "api"

No config needed. Just works.

Most monorepo tools make you TYPE the scope.
devflow infers it.

The payoff: after 2 weeks, your team's commit history is clean and consistent. Without a style guide nobody reads.

Are you in a monorepo? How do you keep commit scopes consistent?

#monorepo #turborepo #nx #yarn #devtools
```

---

## WEEK 3 — Advanced Workflows

---

### Day 7 (Tuesday) — Non-Interactive Mode (NEW)

**Media:** Code snippet showing devflow branch --type feat --ticket ENV-123 --description "add login" (no prompts).

**Post:**

```
Every command in devflow supports non-interactive flags.

devflow branch --type feat --ticket PROJ-123 --description "add auth"
→ Creates branch instantly, no prompts

devflow commit --type fix --scope api --message "handle edge case"
→ Commits instantly

devflow pr --title "..." --body "..." --label feature
→ Creates PR instantly

Why?

Because AI agents, CI/CD scripts, and automation workflows don't want prompts.

I built devflow for humans. But I also made it scriptable.

You can embed it in GitHub Actions, invoke it from code, chain commands.

Run a script that creates 5 branches? Done.
Generate commits programmatically? Done.
Automate releases? Done.

Are you using CLI tools in your workflows? Do you find them hard to script?

#cli #automation #devtools #cicd #typescript
```

---

### Day 8 (Wednesday) — Self-Updating CLI (NEW)

**Media:** Terminal GIF showing `devflow update` checking for new version and installing it.

**Post:**

```
Keeping CLI tools updated is a pain:

npm update -g devflow
npm upgrade -g devflow
brew upgrade devflow
apt-get update

devflow has a built-in update command:

devflow update
→ Checks for new version
→ Shows changelog
→ Installs if you confirm

Checks every 24h in the background.
Notifies you quietly when an update is available.

This is table stakes for developer tools now.
Yet most CLI tools make you dig through package managers.

What's your update strategy for global npm packages?

#devtools #cli #npm #automation #ux
```

---

### Day 9 (Thursday) — Test Plans (NEW)

**Media:** Terminal GIF showing `devflow test-plan` + steps + auto-populating PR body.

**Post:**

```
Code reviews always ask: "how do I test this?"

Most PRs don't have a test plan.
Reviewers guess what to verify.
Bugs slip through.

devflow test-plan:

1. Define test steps BEFORE you code (in the PR)
2. Steps are stored locally per branch
3. When you open the PR, test plan auto-populates the body

Example:
- [ ] Navigate to /login
- [ ] Enter valid credentials
- [ ] Verify redirect to /dashboard
- [ ] Check localStorage has auth token

Now the reviewer has a checklist. They can follow it.

You defined it early. It's not an afterthought.

Do you include test plans in your PRs? Or just description?

#codereview #qa #devtools #testing #bestpractices
```

---

## WEEK 4 — Team & Enterprise

---

### Day 10 (Tuesday) — Shareable Configs (EXPANDED)

**Media:** Code snippet showing `extends: "@myorg/devflow-config"`.

**Post:**

```
Managing git conventions across 5+ repos?

Don't repeat your config.

devflow supports extends:

.devflow/config.json:
{
  "extends": "@myorg/devflow-config",
  "ticketBaseUrl": "https://jira.myorg.com/browse"
}

Your base config lives in one npm package.
Each repo extends it with local overrides.

Update the base config once. All repos get it on next install.

Same pattern as ESLint, Prettier, commitlint.

For teams, this is the difference between "guidelines nobody follows" and "rules that are automated."

How many repos do you maintain? Do you duplicate config?

#configuration #teamwork #bestpractices #monorepo #devtools
```

---

### Day 11 (Wednesday) — Branch Protection (EXPANDED)

**Media:** Terminal screenshot showing the warning when trying to commit to main.

**Post:**

```
How many times have you committed to main by accident?

Me: more times than I want to admit.

devflow warns you:

Try to commit to main/master/develop/production → warning prompt:

"You're on main. Create a branch first?"

It's a 1-second friction that prevents 10 minutes of panic.

Customizable too. Set protected branches in config:

{
  "protectedBranches": ["main", "develop", "staging"]
}

Commit anywhere else? No warning.

Small feature. Huge safety net.

What's your go-to command for "oh no I committed to the wrong branch"?

#git #safety #bestpractices #devtools #cli
```

---

### Day 12 (Thursday) — GitHub Actions CI Integration

**Media:** Code snippet of generated GitHub Actions workflow.

**Post:**

```
devflow init can auto-generate a GitHub Actions CI workflow.

It includes:
- Lint (ESLint)
- Type check (TypeScript)
- Test (Vitest/Jest)
- Build
- Coverage reports

All wired up. Zero configuration.

Push a branch. Actions run. You get instant feedback.

Most teams set this up from scratch. Reading docs. Copying examples.

devflow does it in the init wizard.

"Add a CI workflow?" → "yes" → done.

Saves 30 minutes of boilerplate.

Is your project's CI set up properly? Do you run tests before pushing?

#cicd #github #automation #devtools #bestpractices
```

---

## WEEK 5 — Educational + Deep Dives

---

### Day 13 (Tuesday) — Merge Strategies

**Media:** Terminal GIF showing `devflow merge` with squash/rebase/merge options.

**Post:**

```
Three ways to merge a PR:

1. Merge commit (creates a merge commit, preserves history)
2. Squash (combines all commits into one, clean history)
3. Rebase (replays commits on top, no merge commit)

Which one is right?

- Squash: Single-dev feature branches (cleaner log)
- Rebase: Feature branches where commit history matters
- Merge: Long-lived branches, feature branches with sub-commits

Most teams don't think about this. They just mash "Merge PR."

devflow merge lets you pick:

1. Which strategy
2. Delete branch after? (yes/no)
3. Confirm

One command instead of:
- GitHub UI click
- Copy branch name
- Delete branch manually

Small quality of life improvement.

What's your team's merge strategy? And does everyone follow it?

#git #codereview #teamwork #devtools #bestpractices
```

---

### Day 14 (Wednesday) — Conventional Commits Deep Dive

**Media:** Infographic showing commit types + scope + breaking changes.

**Post:**

```
Conventional commits look complex:

feat(scope): subject
fix(scope): subject  
chore(scope): subject
feat(scope)!: BREAKING subject

But the pattern is simple:

[type]([scope]): [subject]

Types = what kind of change
Scope = which area
! = breaking change (bumps major version)

Why enforce this?

1. Automated changelog generation
2. Auto-determine version bumps (semver)
3. Readable git log
4. Commitlint can enforce it in CI

devflow handles all the syntax for you.
You just answer: type? scope? message?

Tool writes the commit correctly.

Do you use conventional commits? What convinced you (or what's stopping you)?

#git #conventionalcommits #semver #changelog #devtools
```

---

### Day 15 (Thursday) — Changelog Generation (ENHANCED)

**Media:** Terminal output showing `devflow changelog` with grouped commits.

**Post:**

```
Changelogs are boring to write manually.

devflow changelog:

1. Reads commits since last tag
2. Groups by type (Features, Fixes, Chores)
3. Generates markdown
4. Shows in the terminal OR writes to CHANGELOG.md

Output looks like:

## [1.2.0] - 2026-01-27

### Features
- Add GitHub Projects integration (#123)
- Add comments command for PR reviews (#125)

### Fixes
- Branch protection warning on protected branches

### Chores
- Update dependencies

One command. Automatically generated.

If you use conventional commits, your changelog is free.

Do you maintain a CHANGELOG.md? How do you decide what goes in?

#git #release #changelog #devtools #automation
```

---

## WEEK 6 — "How I Built This"

---

### Day 16 (Tuesday) — Architecture: Plugin System

**Media:** Code snippet showing a minimal plugin (10 lines).

**Post:**

```
devflow has a plugin system.

10 lines to add a custom command:

```typescript
export function register(program: Command): void {
  program
    .command("deploy")
    .description("Deploy the current branch")
    .action(() => {
      console.log("Deploying...");
    });
}
```

Publish as devflow-plugin-deploy on npm.

Auto-discovered. Zero configuration.

On the roadmap: plugins for ticket providers.

devflow issues-jira
devflow issues-linear
devflow issues-notion

Each one is just a plugin that implements the same interface.

This is how tools become ecosystems instead of single-use CLIs.

Would you write a devflow plugin for your workflow?

#opensource #plugins #architecture #typescript #cli
```

---

### Day 17 (Wednesday) — Stack: Commander + Inquirer

**Media:** Code snippet showing core dependencies (just 2!).

**Post:**

```
devflow uses exactly 2 npm packages:

commander — for CLI commands
@inquirer/prompts — for interactive prompts

That's it.

No fancy framework.
No bloat.
No dependency hell.

Commander gives you:
- Commands, options, aliases
- Help text generation
- Argument parsing

Inquirer gives you:
- Checkboxes (for file staging)
- Select dropdowns
- Text input
- Validation

Most CLI tools add 10+ dependencies.
Most frameworks add 20+.

devflow: 2 + Node.js built-ins.

Why does this matter?

Fewer deps = fewer bugs = faster security patches = fewer node_modules conflicts = happier teams.

Have you built a CLI before? What do you use for interactivity?

#nodejs #typescript #minimalism #opensoure #architecture
```

---

### Day 18 (Thursday) — Performance & Ship Speed

**Media:** Terminal screenshot showing `devflow [command] --help` output (instant).

**Post:**

```
devflow is fast.

Commands start instantly.
No slow require() chains.
No waiting for TypeScript compilation.
No network calls on startup.

Why?

1. Compiled to plain JavaScript
2. Only imports what it needs (lazy loading)
3. No async startup code
4. git operations are sync when possible

Humans are sensitive to latency. >100ms feels slow.

devflow runs in 20-50ms.

If your CLI takes 500ms to respond to --help → people will use it less.
If it runs in 50ms → it becomes muscle memory.

Performance is a feature.

Do you avoid CLI tools because they feel slow?

#performance #nodesojs #devtools #ux #optimization
```

---

## WEEK 7-9 — Feature Highlights + Engagement

---

### Day 19 (Tuesday) — Dry Run Flag (EXPANDED)

**Media:** Terminal showing `devflow commit --dry-run` previewing without executing.

**Post:**

```
Every command that modifies git state supports --dry-run.

devflow branch --dry-run → shows branch name, doesn't create it
devflow commit --dry-run → shows commit message, doesn't commit
devflow pr --dry-run → shows PR body, doesn't create PR
devflow merge --dry-run → shows merge plan, doesn't merge
devflow release --dry-run → shows tag + changelog, doesn't release

See what would happen. Execute nothing.

New to devflow? Use --dry-run first.
About to run something critical? Use --dry-run.
Writing automation? Test with --dry-run first.

I use --dry-run before every release.
It's 10 seconds that prevent 10-hour rollbacks.

Trust tools. Verify first.

Do you use dry-run on tools? Or do you live dangerously?

#bestpractices #git #safety #automation #devtools
```

---

### Day 20 (Wednesday) — Shell Completions

**Media:** Terminal GIF showing tab completion for all devflow commands.

**Post:**

```
Small detail that separates polished CLI tools from half-finished ones:

Shell completions.

devflow b<TAB> → devflow branch
devflow c<TAB> → devflow commit
devflow p<TAB> → devflow pr
devflow m<TAB> → devflow merge

Setup (one line in your shell config):

zsh: eval "$(devflow completions --shell zsh)"
bash: eval "$(devflow completions --shell bash)"

Saves you 10 seconds per day.
But more importantly: it makes the tool feel *professional*.

It's the difference between a toy script and a real tool.

Do you set up completions for your CLI tools?

#cli #productivity #ux #devtools #shell
```

---

### Day 21 (Tuesday, Week 8) — Doctor Command (Health Check)

**Media:** Terminal screenshot showing `devflow doctor` output with checkmarks and X marks.

**Post:**

```
"Works on my machine" but for your git setup:

devflow doctor

Checks:
✓ git installed
✓ node version
✓ gh CLI installed
✓ .devflow/config.json exists and valid
✓ commitlint config
✓ husky hooks
✓ typescript installed
✓ tests configured

One command tells you if your project is fully set up.

New team member? Run doctor.
CI randomly failing? Run doctor.
Upgrade node? Run doctor.

No more "did you install husky?" or "is your node version right?"

Doctor tells you what's missing and how to fix it.

Does your project have a health check? What would it check?

#dx #devtools #onboarding #productivity #automation
```

---

### Day 22 (Thursday, Week 8) — Engagement: Best Git Moment

**Post (text-only):**

```
Tell me your best git moment.

Mine: realizing `git reflog` could undo literally anything.
That command has saved my butt 50+ times.

Other good ones I've heard:
- Learning squash-rebase
- Discovering git stash
- Understanding rebase -i
- Setting up aliases

What skill/command/workflow made you better at git?

#git #development #learning #story
```

---

### Day 23 (Tuesday, Week 9) — Stats Command

**Media:** Terminal screenshot of `devflow stats` with bar charts and metrics.

**Post:**

```
I added analytics to devflow:

devflow stats

Shows:
- Commit types breakdown (pie chart)
- Top scopes
- Contributors
- Most active day/time
- Total commits since first commit

It's not essential. But it's fun.

And it tells you something real: is your commit history actually conventional or just chaos?

Examples from my repos:
- 43% chore commits (time to refactor my workflow)
- Top scope is "deps" (dependencies = most of my time)
- 2.5 commits/day average
- Most active: Thursday morning

Run it on your repo. What's surprising?

#git #analytics #metrics #devtools #reflection
```

---

## WEEK 10-12 — Roadmap + Community

---

### Day 24 (Wednesday, Week 10) — Public Roadmap

**Media:** Screenshot of the roadmap page from devflow.alejandrochaves.dev

**Post:**

```
devflow has a public roadmap.

Planned:

Q1 2026:
- Jira ticket provider plugin
- Linear ticket provider plugin
- Shortcut provider

Q2 2026:
- GitLab support (git host abstraction)
- Azure DevOps provider
- Trello provider

Q3 2026:
- Notion provider
- AI commit suggestions (Claude API)

You can see what's coming. Vote on what you want next.

This is how you build in public.

The feature list isn't from assumptions.
It's from users who said "I'd use this if..."

What feature would you vote for?

#buildinpublic #opensource #roadmap #community #devtools
```

---

### Day 25 (Thursday, Week 11) — Contributor Call-Out

**Post (text-only):**

```
devflow is 100% open source on GitHub.

If you've contributed to open source before:
- PRs welcome
- Issues labeled "good first issue" for newcomers
- Code of conduct in place
- Friendly reviews

If you've never contributed:
- Now's a good time
- Pick an issue, ask questions, submit a PR
- I'll review thoughtfully and merge within 48h

Contributing is how you learn. And how communities grow.

Interested? Check the CONTRIBUTING.md.

Have you contributed to open source? What was your first PR?

#opensource #community #contributing #github #developers
```

---

### Day 26 (Friday, Week 12) — Thank You + Next Chapter

**Post:**

```
12 weeks ago, I started sharing devflow on LinkedIn.

Here's what happened:

- [X] stars on GitHub
- [X] npm downloads
- [X] people messaged me features they wanted
- [X] first PRs from contributors
- [X] docs site traffic

Building in public works.

The roadmap changed based on real feedback. The tool got better. The community grew.

I went from "solo project" to "thing people use."

What's next?

Q1: Finish the ticket provider roadmap.
Q2: Make devflow the default git tool for teams.
Q3: Maybe a GUI? (jk... unless?)

If you use devflow: thanks.
If you've thought about trying it: no time like now.
If you want to contribute: I'm ready.

#buildinpublic #opensource #thankyou #nextchapter

---

## Metrics to Track (Updated)

| Metric | Target by Week 12 |
|--------|------------------|
| GitHub Stars | 1500+ |
| npm Downloads | 5000+/month |
| Post Impressions | 5000+ per post |
| Engagement Rate | 50+ reactions/comments |
| Profile Visitors | 2000+/month |
| Inbound PRs | 5+ contributors |

---

## Key Changes from v1.0

1. **New features to promote:** Issues, Comments, Update, Test Plan, Non-interactive flags
2. **Expanded features:** Monorepo support, Shareable configs, Branch protection
3. **Different angle:** Not just workflow tool → complete git companion
4. **AI/Automation story:** Non-interactive flags appeal to scripts + CI/CD
5. **Ecosystem play:** Plugin system + ticket providers (roadmap)
6. **Team appeal:** Shareable configs + branch protection for team safety
7. **More educational content:** Deep dives into git concepts + architecture decisions

---

## Media Production Notes

All media recommendations from v1.0 still apply (vhs for terminal GIFs, ray.so for code snippets, etc.). Key addition:

- **Stats visualizations** should use `chalk` + Unicode box drawing for terminal charts (keep ASCII-art looking, not pixel-based)
- **Code snippets** should always show TypeScript (strongly typed) when possible
- **Demos should include the non-interactive flags** — show both `devflow branch` (interactive) and `devflow branch --type feat --ticket ID-123 --description "..."` (scriptable)

---

## Hashtag Strategy (Updated)

**Core (always):** #devtools #git

**Rotate 3 from:**
- #opensource
- #cli
- #typescript
- #buildinpublic
- #automation (increased weight due to non-interactive flags)
- #productivity
- #monorepo (new, featured more)
- #codereview
- #conventionalcommits
- #nodejs

---

## Engagement Tactics (New)

1. **Pin one post per week** — Your best performer gets pinned for visibility
2. **Reply with follow-up questions** — Don't just acknowledge, ask about their workflow
3. **Share user stories** — When someone uses devflow productively, highlight it
4. **Weekly "ask me anything" session** — One post/week that's purely question-driven
5. **Spotlight contributors** — When you get PRs, thank them publicly

---

## Timing Consideration

Since the original plan was made 2+ months ago and the tool has evolved significantly:

**Recommendation:** Start with Week 1-4 of v2 (repositioning + new features), then follow weeks 5-12. This keeps the momentum but reflects the actual product state.
