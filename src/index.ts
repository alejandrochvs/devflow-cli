#!/usr/bin/env node
import { Command } from "commander";
import { branchCommand } from "./commands/branch.js";
import { commitCommand } from "./commands/commit.js";
import { prCommand } from "./commands/pr.js";
import { initCommand } from "./commands/init.js";

const program = new Command();

program
  .name("devflow")
  .description("Interactive CLI for branch creation, conventional commits, and PR management")
  .version("0.1.0");

program
  .command("branch")
  .description("Create a new branch with type/ticket/description format")
  .action(branchCommand);

program
  .command("commit")
  .description("Create a conventional commit with guided prompts")
  .action(commitCommand);

program
  .command("pr")
  .description("Create or update a pull request with auto-filled template")
  .action(prCommand);

program
  .command("init")
  .description("Initialize a .devflow.json config file in the current project")
  .action(initCommand);

program.parse();
