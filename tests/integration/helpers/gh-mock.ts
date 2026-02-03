/**
 * GitHub CLI Mock Helper
 * Provides mock responses for gh CLI commands in tests
 */

import { vi, type Mock } from 'vitest';
import { execSync } from 'child_process';

export interface GhMockConfig {
  /** Mock responses keyed by command pattern */
  responses: Record<string, string | (() => string)>;
  /** Whether to pass through non-mocked commands */
  passthrough?: boolean;
}

export interface GhMock {
  /** The mock function */
  mock: Mock;
  /** Add a mock response for a command pattern */
  mockCommand: (pattern: string, response: string | (() => string)) => void;
  /** Clear all mock responses */
  clearMocks: () => void;
  /** Restore original execSync */
  restore: () => void;
}

/**
 * Common gh CLI mock responses
 */
export const GH_MOCK_RESPONSES = {
  // PR responses
  'gh pr view': JSON.stringify({
    number: 42,
    title: 'Test PR',
    state: 'OPEN',
    url: 'https://github.com/test/repo/pull/42',
  }),

  'gh pr list': JSON.stringify([
    { number: 42, title: 'Test PR 1', state: 'OPEN' },
    { number: 43, title: 'Test PR 2', state: 'OPEN' },
  ]),

  'gh pr create': 'https://github.com/test/repo/pull/42',

  // Issue responses
  'gh issue view': JSON.stringify({
    number: 123,
    title: 'Test Issue',
    state: 'OPEN',
    labels: [{ name: 'feature' }],
  }),

  'gh issue list': JSON.stringify([
    { number: 123, title: 'Test Issue 1', state: 'OPEN' },
    { number: 124, title: 'Test Issue 2', state: 'OPEN' },
  ]),

  'gh issue create': 'https://github.com/test/repo/issues/123',

  // Repo responses
  'gh repo view': JSON.stringify({
    name: 'test-repo',
    owner: { login: 'test-owner' },
    defaultBranchRef: { name: 'main' },
  }),

  // Auth responses
  'gh auth status': 'Logged in to github.com',
};

/**
 * Creates a mock for GitHub CLI commands
 */
export function createGhMock(config: Partial<GhMockConfig> = {}): GhMock {
  const { passthrough = false } = config;
  const responses = new Map<string, string | (() => string)>(
    Object.entries(config.responses || {})
  );

  // Store original execSync
  const originalExecSync = execSync;

  // Create mock function
  const mockFn = vi.fn((cmd: string, opts?: object) => {
    const cmdStr = String(cmd);

    // Check if this is a gh command
    if (cmdStr.startsWith('gh ')) {
      // Find matching response
      for (const [pattern, response] of responses) {
        if (cmdStr.includes(pattern) || cmdStr.startsWith(pattern)) {
          return typeof response === 'function' ? response() : response;
        }
      }

      // No match found
      if (!passthrough) {
        throw new Error(`Unmocked gh command: ${cmdStr}`);
      }
    }

    // Pass through non-gh commands or when passthrough is enabled
    return originalExecSync(cmd, opts);
  });

  return {
    mock: mockFn,

    mockCommand(pattern: string, response: string | (() => string)) {
      responses.set(pattern, response);
    },

    clearMocks() {
      responses.clear();
      mockFn.mockClear();
    },

    restore() {
      mockFn.mockRestore();
    },
  };
}

/**
 * Creates a gh mock with common responses pre-configured
 */
export function createGhMockWithDefaults(): GhMock {
  return createGhMock({
    responses: GH_MOCK_RESPONSES,
    passthrough: true,
  });
}
