#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "fs";
import { branchCommand } from "./commands/branch.js";
import { commitCommand } from "./commands/commit.js";
import { prCommand } from "./commands/pr.js";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { amendCommand } from "./commands/amend.js";
import { cleanupCommand } from "./commands/cleanup.js";
import { changelogCommand } from "./commands/changelog.js";
import { doctorCommand } from "./commands/doctor.js";
import { undoCommand } from "./commands/undo.js";
import { mergeCommand } from "./commands/merge.js";
import { fixupCommand } from "./commands/fixup.js";
import { testPlanCommand } from "./commands/test-plan.js";
import { releaseCommand } from "./commands/release.js";
import { reviewCommand } from "./commands/review.js";
import { stashCommand } from "./commands/stash.js";
import { worktreeCommand } from "./commands/worktree.js";
import { logCommand } from "./commands/log.js";
import { statsCommand } from "./commands/stats.js";
import { lintConfigCommand } from "./commands/lint-config.js";
import { commentsCommand } from "./commands/comments.js";
import { loadPlugins } from "./plugins.js";
import { checkForUpdates } from "./update-notifier.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

// Check for updates (non-blocking, cached)
checkForUpdates();

const program = new Command();

program
  .name("devflow")
  .description("Interactive CLI for branch creation, conventional commits, and PR management")
  .version(pkg.version);

// --- Core commands ---

program
  .command("branch")
  .alias("b")
  .description("Create a new branch with type/ticket/description format")
  .option("--dry-run", "Preview without executing git commands")
  .action((opts) => branchCommand(opts));

program
  .command("commit")
  .alias("c")
  .description("Create a conventional commit with guided prompts")
  .option("--dry-run", "Preview without executing git commands")
  .action((opts) => commitCommand(opts));

program
  .command("pr")
  .alias("p")
  .description("Create or update a pull request with auto-filled template")
  .option("--dry-run", "Preview without executing git commands")
  .action((opts) => prCommand(opts));

program
  .command("amend")
  .alias("a")
  .description("Amend the last commit with guided prompts")
  .option("--dry-run", "Preview without executing git commands")
  .action((opts) => amendCommand(opts));

program
  .command("undo")
  .alias("u")
  .description("Undo the last commit (keeps changes staged)")
  .option("--dry-run", "Preview without executing git commands")
  .action((opts) => undoCommand(opts));

program
  .command("fixup")
  .alias("f")
  .description("Create a fixup commit targeting a previous commit")
  .option("--dry-run", "Preview without executing git commands")
  .action((opts) => fixupCommand(opts));

program
  .command("merge")
  .alias("m")
  .description("Merge the current branch PR with squash/merge/rebase")
  .option("--dry-run", "Preview without executing git commands")
  .action((opts) => mergeCommand(opts));

program
  .command("release")
  .alias("rel")
  .description("Create a release with version bump, changelog, tag, and GitHub release")
  .action(releaseCommand);

program
  .command("review")
  .alias("rv")
  .description("List and interact with open pull requests")
  .action(reviewCommand);

program
  .command("comments")
  .alias("cm")
  .description("Show PR reviews and inline comments with diff context")
  .option("--number <number>", "PR number (defaults to current branch PR)")
  .option("--resolved", "Show only resolved comments")
  .option("--unresolved", "Show only unresolved comments")
  .action((opts) => commentsCommand(opts));

program
  .command("stash")
  .alias("st")
  .description("Save, pop, apply, or drop named stashes")
  .action(stashCommand);

program
  .command("worktree")
  .alias("wt")
  .description("Manage git worktrees for parallel branch work")
  .action(worktreeCommand);

program
  .command("log")
  .alias("l")
  .description("Interactive commit log with cherry-pick, revert, and fixup actions")
  .action(logCommand);

// --- Info commands ---

program
  .command("status")
  .alias("s")
  .description("Show current branch, ticket, commits, and PR info")
  .action(statusCommand);

program
  .command("test-plan")
  .alias("tp")
  .description("View or edit the test plan for the current branch")
  .action(testPlanCommand);

program
  .command("changelog")
  .description("Generate a changelog from conventional commits since last tag")
  .option("--dry-run", "Preview without writing to file")
  .action((opts) => changelogCommand(opts));

program
  .command("cleanup")
  .description("Delete local branches that have been merged or whose remote is gone")
  .option("--dry-run", "Preview without deleting branches")
  .action((opts) => cleanupCommand(opts));

program
  .command("stats")
  .description("Show commit type distribution, top scopes, and contributor stats")
  .action(statsCommand);

program
  .command("lint-config")
  .alias("lint")
  .description("Validate .devflow.json for errors and warnings (CI-friendly)")
  .action(lintConfigCommand);

// --- Setup commands ---

program
  .command("init")
  .description("Initialize a .devflow.json config and project setup")
  .action(initCommand);

program
  .command("doctor")
  .description("Check that all devflow dependencies are properly configured")
  .action(doctorCommand);

program
  .command("completions")
  .description("Output shell completion script")
  .option("--shell <shell>", "Shell type (bash or zsh)", "zsh")
  .action((opts) => {
    if (opts.shell === "bash") {
      console.log(generateBashCompletions());
    } else {
      console.log(generateZshCompletions());
    }
  });

// Load plugins before parsing
await loadPlugins(program);

program.parse();

function generateBashCompletions(): string {
  return `# devflow bash completions
# Add to ~/.bashrc: eval "$(devflow completions --shell bash)"
_devflow_completions() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local commands="branch commit pr amend undo fixup merge release review comments stash worktree log status test-plan changelog cleanup stats lint-config init doctor completions"

  if [ "\${COMP_CWORD}" -eq 1 ]; then
    COMPREPLY=($(compgen -W "\${commands}" -- "\${cur}"))
  elif [ "\${COMP_CWORD}" -eq 2 ]; then
    COMPREPLY=($(compgen -W "--dry-run --help" -- "\${cur}"))
  fi
}
complete -F _devflow_completions devflow`;
}

function generateZshCompletions(): string {
  return `# devflow zsh completions
# Add to ~/.zshrc: eval "$(devflow completions --shell zsh)"
_devflow() {
  local -a commands
  commands=(
    'branch:Create a new branch (alias: b)'
    'commit:Create a conventional commit (alias: c)'
    'pr:Create or update a pull request (alias: p)'
    'amend:Amend the last commit (alias: a)'
    'undo:Undo the last commit (alias: u)'
    'fixup:Create a fixup commit (alias: f)'
    'merge:Merge the current PR (alias: m)'
    'release:Create a release (alias: rel)'
    'review:List and interact with PRs (alias: rv)'
    'comments:Show PR reviews and inline comments (alias: cm)'
    'stash:Manage named stashes (alias: st)'
    'worktree:Manage git worktrees (alias: wt)'
    'log:Interactive commit log (alias: l)'
    'status:Show branch and PR info (alias: s)'
    'test-plan:View or edit test plan (alias: tp)'
    'changelog:Generate changelog from commits'
    'cleanup:Delete merged local branches'
    'stats:Show commit and contributor stats'
    'lint-config:Validate .devflow.json (alias: lint)'
    'init:Initialize devflow config'
    'doctor:Check devflow dependencies'
    'completions:Output shell completion script'
  )

  _arguments -C \\
    '1: :->command' \\
    '*::arg:->args'

  case "\$state" in
    command)
      _describe 'command' commands
      ;;
    args)
      case "\${words[1]}" in
        branch|commit|pr|amend|undo|fixup|merge|cleanup|changelog)
          _arguments '--dry-run[Preview without executing]'
          ;;
        completions)
          _arguments '--shell[Shell type]:shell:(bash zsh)'
          ;;
      esac
      ;;
  esac
}
compdef _devflow devflow`;
}
