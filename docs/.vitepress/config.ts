import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'devflow',
  description: 'Interactive CLI for branch creation, conventional commits, and PR management',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  themeConfig: {
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Commands', link: '/commands/branch' },
      { text: 'Configuration', link: '/configuration' },
      { text: 'Plugins', link: '/plugins' },
      { text: 'Roadmap', link: '/roadmap' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Configuration', link: '/configuration' },
          { text: 'Integrations', link: '/integrations' },
          { text: 'Plugins', link: '/plugins' },
          { text: 'Roadmap', link: '/roadmap' },
        ],
      },
      {
        text: 'Core Commands',
        items: [
          { text: 'branch', link: '/commands/branch' },
          { text: 'commit', link: '/commands/commit' },
          { text: 'pr', link: '/commands/pr' },
          { text: 'amend', link: '/commands/amend' },
          { text: 'undo', link: '/commands/undo' },
          { text: 'fixup', link: '/commands/fixup' },
          { text: 'merge', link: '/commands/merge' },
        ],
      },
      {
        text: 'Workflow',
        items: [
          { text: 'issue', link: '/commands/issue' },
          { text: 'release', link: '/commands/release' },
          { text: 'review', link: '/commands/review' },
          { text: 'comments', link: '/commands/comments' },
          { text: 'stash', link: '/commands/stash' },
          { text: 'worktree', link: '/commands/worktree' },
          { text: 'log', link: '/commands/log' },
        ],
      },
      {
        text: 'Info',
        items: [
          { text: 'status', link: '/commands/status' },
          { text: 'test-plan', link: '/commands/test-plan' },
          { text: 'changelog', link: '/commands/changelog' },
          { text: 'cleanup', link: '/commands/cleanup' },
          { text: 'stats', link: '/commands/stats' },
          { text: 'lint-config', link: '/commands/lint-config' },
        ],
      },
      {
        text: 'Setup',
        items: [
          { text: 'doctor', link: '/commands/doctor' },
          { text: 'completions', link: '/commands/completions' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/alejandrochvs/devflow-cli' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Alejandro Chaves',
    },

    search: {
      provider: 'local',
    },
  },
})
