<script setup lang="ts">
const cmds = [
  { c: 'devflow init',     d: 'set up config, husky, commitlint, scripts' },
  { c: 'devflow branch',   d: 'consistent type/TICKET_description naming' },
  { c: 'devflow commit',   d: 'guided conventional commit' },
  { c: 'devflow pr',       d: 'auto-filled PR template + auto labels' },
  { c: 'devflow release',  d: 'version bump, changelog, tag, gh release' },
  { c: 'devflow review',   d: 'list, approve, comment on open PRs' },
  { c: 'devflow issue',    d: 'scrum-style issue with branch hand-off' },
  { c: 'devflow stash',    d: 'named stashes, interactive' },
  { c: 'devflow worktree', d: 'manage parallel worktrees' },
  { c: 'devflow log',      d: 'interactive commit history + actions' },
  { c: 'devflow stats',    d: 'commit pattern analytics' },
  { c: 'devflow doctor',   d: 'verify git, gh, husky, hooks, config' },
]
</script>

<template>
  <section class="vp-section">
    <div class="vp-section-head">
      <span class="vp-mono-tag">COMMAND SURFACE</span>
      <h2 class="vp-section-title">Every command, one short flag.</h2>
      <p class="vp-section-sub">
        Aliases are one or two letters. <code>devflow b</code>, <code>c</code>, <code>p</code>, <code>rel</code>, <code>i</code>, <code>st</code>…
      </p>
    </div>
    <div class="vp-cmd-grid">
      <div v-for="cmd in cmds" :key="cmd.c" class="vp-cmd">
        <div class="vp-cmd-line">
          <span class="vp-acc">$</span>
          <span class="vp-cmd-name"> {{ cmd.c }}</span>
        </div>
        <div class="vp-cmd-d">{{ cmd.d }}</div>
      </div>
    </div>
  </section>
</template>
