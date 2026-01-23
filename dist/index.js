#!/usr/bin/env node
import { Command } from "commander";
import { branchCommand } from "./commands/branch.js";
import { commitCommand } from "./commands/commit.js";
import { prCommand } from "./commands/pr.js";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { amendCommand } from "./commands/amend.js";
import { cleanupCommand } from "./commands/cleanup.js";
import { changelogCommand } from "./commands/changelog.js";
import { doctorCommand } from "./commands/doctor.js";
const program = new Command();
program
    .name("devflow")
    .description("Interactive CLI for branch creation, conventional commits, and PR management")
    .version("0.2.0");
program
    .command("branch")
    .description("Create a new branch with type/ticket/description format")
    .option("--dry-run", "Preview without executing git commands")
    .action((opts) => branchCommand(opts));
program
    .command("commit")
    .description("Create a conventional commit with guided prompts")
    .option("--dry-run", "Preview without executing git commands")
    .action((opts) => commitCommand(opts));
program
    .command("pr")
    .description("Create or update a pull request with auto-filled template")
    .option("--dry-run", "Preview without executing git commands")
    .action((opts) => prCommand(opts));
program
    .command("init")
    .description("Initialize a .devflow.json config and project setup")
    .action(initCommand);
program
    .command("status")
    .description("Show current branch, ticket, commits, and PR info")
    .action(statusCommand);
program
    .command("amend")
    .description("Amend the last commit with guided prompts")
    .option("--dry-run", "Preview without executing git commands")
    .action((opts) => amendCommand(opts));
program
    .command("cleanup")
    .description("Delete local branches that have been merged or whose remote is gone")
    .option("--dry-run", "Preview without deleting branches")
    .action((opts) => cleanupCommand(opts));
program
    .command("changelog")
    .description("Generate a changelog from conventional commits since last tag")
    .option("--dry-run", "Preview without writing to file")
    .action((opts) => changelogCommand(opts));
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
    }
    else {
        console.log(generateZshCompletions());
    }
});
program.parse();
function generateBashCompletions() {
    return `# devflow bash completions
# Add to ~/.bashrc: eval "$(devflow completions --shell bash)"
_devflow_completions() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local commands="branch commit pr init status amend cleanup changelog doctor completions"

  if [ "\${COMP_CWORD}" -eq 1 ]; then
    COMPREPLY=($(compgen -W "\${commands}" -- "\${cur}"))
  elif [ "\${COMP_CWORD}" -eq 2 ]; then
    COMPREPLY=($(compgen -W "--dry-run --help" -- "\${cur}"))
  fi
}
complete -F _devflow_completions devflow`;
}
function generateZshCompletions() {
    return `# devflow zsh completions
# Add to ~/.zshrc: eval "$(devflow completions --shell zsh)"
_devflow() {
  local -a commands
  commands=(
    'branch:Create a new branch with type/ticket/description format'
    'commit:Create a conventional commit with guided prompts'
    'pr:Create or update a pull request'
    'init:Initialize devflow config and project setup'
    'status:Show current branch, ticket, commits, and PR info'
    'amend:Amend the last commit with guided prompts'
    'cleanup:Delete merged local branches'
    'changelog:Generate changelog from conventional commits'
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
        branch|commit|pr|amend|cleanup|changelog)
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
//# sourceMappingURL=index.js.map