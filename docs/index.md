---
layout: home

hero:
  name: devflow
  text: Git workflows, simplified
  tagline: Interactive CLI for branch creation, conventional commits, and PR management
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/alejandrochvs/devflow-cli
    - theme: alt
      text: Sponsor
      link: https://github.com/sponsors/alejandrochvs

features:
  - icon: 📝
    title: Guided Commits
    details: Interactive conventional commit builder with scope selection, ticket inference, and breaking change support.
  - icon: 🌿
    title: Smart Branches
    details: Consistent branch naming with type prefixes, ticket numbers, and auto-kebab-cased descriptions.
  - icon: 🔀
    title: PR Automation
    details: Auto-filled PR templates with commit lists, labels, ticket links, and customizable checklists.
  - icon: 🚀
    title: Release Flow
    details: Automated version bumps, changelog generation, git tags, and GitHub releases in one command.
  - icon: 👥
    title: Team Workflows
    details: Review PRs, manage stashes, worktrees, and view commit logs — all from an interactive interface.
  - icon: 🔌
    title: Extensible
    details: Plugin system for custom commands. Auto-discovers devflow-plugin-* packages or configure explicitly.
---

<div style="display: flex; justify-content: center; gap: 8px; margin-top: 24px;">
  <a href="https://www.npmjs.com/package/@alejandrochaves/devflow-cli"><img src="https://img.shields.io/npm/dm/@alejandrochaves/devflow-cli" alt="npm downloads"></a>
  <a href="https://www.npmjs.com/package/@alejandrochaves/devflow-cli"><img src="https://img.shields.io/npm/v/@alejandrochaves/devflow-cli" alt="npm version"></a>
  <a href="https://github.com/alejandrochvs/devflow-cli"><img src="https://img.shields.io/github/stars/alejandrochvs/devflow-cli" alt="GitHub stars"></a>
</div>

<div style="margin-top: 48px; text-align: center;">
  <h2 style="font-size: 1.5rem; margin-bottom: 16px;">See it in action</h2>
  <p style="color: var(--vp-c-text-2); margin-bottom: 24px;">A complete workflow: create branch → commit → open PR</p>
  <img src="/gifs/full-feature.gif" alt="devflow complete workflow demo" style="max-width: 800px; width: 100%; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);" />
</div>
