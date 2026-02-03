#!/usr/bin/env node

/**
 * Demo Coverage Report
 * Checks which devflow commands have demo tape files
 */

import { readdirSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// All devflow commands that should have demos
const COMMANDS = [
  // Core
  'branch', 'commit', 'amend', 'undo', 'fixup', 'merge', 'log',
  // PR
  'pr', 'review', 'comments',
  // Issues
  'issue', 'issues', 'test-plan',
  // Stash/Worktree
  'stash', 'worktree',
  // Release
  'release', 'changelog', 'cleanup', 'stats',
  // Setup
  'init', 'doctor', 'status', 'lint-config', 'completions', 'update'
];

function findTapeFiles(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTapeFiles(fullPath));
    } else if (entry.name.endsWith('.tape')) {
      // Extract command name from filename (e.g., "branch.tape" -> "branch")
      files.push(basename(entry.name, '.tape'));
    }
  }

  return files;
}

function main() {
  const demosDir = resolve(__dirname, '..', 'demos');
  const tapeFiles = findTapeFiles(demosDir);

  console.log('\n=== Demo Coverage Report ===\n');

  let covered = 0;
  const missing: string[] = [];

  for (const cmd of COMMANDS) {
    const hasTape = tapeFiles.includes(cmd);
    const status = hasTape ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${status} ${cmd}`);
    if (hasTape) {
      covered++;
    } else {
      missing.push(cmd);
    }
  }

  const percentage = ((covered / COMMANDS.length) * 100).toFixed(1);
  const color = covered === COMMANDS.length ? '\x1b[32m' : '\x1b[33m';

  console.log(`\n${color}Coverage: ${covered}/${COMMANDS.length} (${percentage}%)\x1b[0m`);

  // Also report workflow demos
  const workflowTapes = tapeFiles.filter(f =>
    !COMMANDS.includes(f) &&
    !['demo'].includes(f)
  );

  if (workflowTapes.length > 0) {
    console.log(`\nWorkflow demos: ${workflowTapes.length}`);
    for (const wf of workflowTapes) {
      console.log(`  \x1b[36m•\x1b[0m ${wf}`);
    }
  }

  console.log(`\nTotal tape files: ${tapeFiles.length}\n`);

  // Exit with error if below threshold (80%)
  const threshold = 0.8;
  if (covered / COMMANDS.length < threshold) {
    console.log(`\x1b[31mError: Coverage ${percentage}% is below threshold ${threshold * 100}%\x1b[0m`);
    if (missing.length > 0) {
      console.log(`\nMissing demos for: ${missing.join(', ')}\n`);
    }
    process.exit(1);
  }
}

main();
