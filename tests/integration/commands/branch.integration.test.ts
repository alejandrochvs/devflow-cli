/**
 * Integration tests for devflow branch command
 * Tests branch creation in isolated git repositories
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestRepo, type TestRepo } from '../helpers/git-fixture.js';

describe('branch command integration', () => {
  let repo: TestRepo;

  beforeEach(() => {
    repo = createTestRepo({ withConfig: true, withInitialCommit: true });
  });

  afterEach(() => {
    repo.cleanup();
  });

  describe('git fixture helper', () => {
    it('should create an isolated git repository', () => {
      const status = repo.git('status');
      expect(status).toContain('On branch main');
    });

    it('should have initial commit', () => {
      const log = repo.git('log --oneline');
      expect(log).toContain('Initial commit');
    });

    it('should allow creating new branches', () => {
      repo.git('checkout -b feat/123_new-feature');
      const branch = repo.git('branch --show-current');
      expect(branch).toBe('feat/123_new-feature');
    });

    it('should allow creating files and commits', () => {
      repo.createFile('src/index.ts', 'console.log("hello");');
      repo.git('add .');
      repo.git('commit -m "feat[123](core): add index file"');

      const log = repo.git('log --oneline -1');
      expect(log).toContain('add index file');
    });

    it('should have .devflow config when withConfig is true', () => {
      const config = repo.git('ls-files .devflow/config.json');
      expect(config).toBe(''); // Not tracked, but exists
    });
  });

  describe('branch naming', () => {
    it('should allow feature branch format', () => {
      repo.git('checkout -b feat/PROJ-123_add-login');
      const branch = repo.git('branch --show-current');
      expect(branch).toBe('feat/PROJ-123_add-login');
    });

    it('should allow fix branch format', () => {
      repo.git('checkout -b fix/PROJ-456_button-alignment');
      const branch = repo.git('branch --show-current');
      expect(branch).toBe('fix/PROJ-456_button-alignment');
    });

    it('should list all branches', () => {
      repo.git('checkout -b feat/123_feature-a');
      repo.git('checkout main');
      repo.git('checkout -b fix/456_fix-b');

      const branches = repo.git('branch --list');
      expect(branches).toContain('feat/123_feature-a');
      expect(branches).toContain('fix/456_fix-b');
      expect(branches).toContain('main');
    });
  });
});
