/**
 * Git Test Fixture Helper
 * Creates isolated git repositories for integration testing
 */

import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface TestRepo {
  /** Path to the test repository */
  path: string;
  /** Run a git command in the test repo */
  git: (cmd: string) => string;
  /** Create a file in the test repo */
  createFile: (name: string, content?: string) => void;
  /** Create a commit with optional files */
  commit: (message: string, files?: string[]) => void;
  /** Clean up the test repository */
  cleanup: () => void;
}

export interface CreateTestRepoOptions {
  /** Initialize with a .devflow config */
  withConfig?: boolean;
  /** Create initial commit */
  withInitialCommit?: boolean;
  /** Branch name for initial setup */
  initialBranch?: string;
}

/**
 * Creates an isolated test git repository
 */
export function createTestRepo(options: CreateTestRepoOptions = {}): TestRepo {
  const {
    withConfig = false,
    withInitialCommit = true,
    initialBranch = 'main',
  } = options;

  // Create temp directory
  const testDir = mkdtempSync(join(tmpdir(), 'devflow-test-'));

  // Helper to run git commands
  const git = (cmd: string): string => {
    return execSync(`git ${cmd}`, {
      cwd: testDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  };

  // Initialize git repo
  git('init');
  git('config user.email "test@devflow.test"');
  git('config user.name "Test User"');
  git(`checkout -b ${initialBranch}`);

  // Helper to create files
  const createFile = (name: string, content = ''): void => {
    const filePath = join(testDir, name);
    const dir = join(testDir, name.split('/').slice(0, -1).join('/'));
    if (dir !== testDir) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, content);
  };

  // Helper to create commits
  const commit = (message: string, files: string[] = []): void => {
    if (files.length === 0) {
      // Create a dummy file if no files specified
      const timestamp = Date.now();
      createFile(`file-${timestamp}.txt`, `Created at ${timestamp}`);
      git('add .');
    } else {
      for (const file of files) {
        createFile(file, `Content of ${file}`);
      }
      git(`add ${files.join(' ')}`);
    }
    git(`commit -m "${message}"`);
  };

  // Create initial commit if requested
  if (withInitialCommit) {
    createFile('README.md', '# Test Repository\n');
    git('add .');
    git('commit -m "Initial commit"');
  }

  // Create .devflow config if requested
  if (withConfig) {
    mkdirSync(join(testDir, '.devflow'), { recursive: true });
    writeFileSync(
      join(testDir, '.devflow', 'config.json'),
      JSON.stringify(
        {
          preset: 'scrum',
          commitFormat: '{type}[{ticket}]({scope}): {message}',
          branchFormat: '{type}/{ticket}_{description}',
        },
        null,
        2
      )
    );
  }

  // Cleanup function
  const cleanup = (): void => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  };

  return {
    path: testDir,
    git,
    createFile,
    commit,
    cleanup,
  };
}

/**
 * Creates a test repo with some commits for testing
 */
export function createTestRepoWithHistory(): TestRepo {
  const repo = createTestRepo({ withConfig: true });

  // Add some commits with conventional format
  repo.commit('feat[123](auth): add login form');
  repo.commit('fix[123](auth): handle empty password');
  repo.commit('feat[124](ui): add dark mode toggle');
  repo.commit('docs[125](readme): update installation guide');

  return repo;
}
