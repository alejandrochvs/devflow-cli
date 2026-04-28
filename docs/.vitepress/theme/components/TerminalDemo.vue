<template>
  <section class="vp-section">
    <div class="vp-section-head">
      <span class="vp-mono-tag">DEMO · GUIDED COMMIT</span>
      <h2 class="vp-section-title">Type less. Ship in the same shape every time.</h2>
      <p class="vp-section-sub">
        devflow walks you through the commit, then formats it exactly to your team's convention.
      </p>
    </div>
    <div class="vp-terminal">
      <div class="vp-terminal-bar">
        <span class="vp-tdot" style="background: #ff5f57" />
        <span class="vp-tdot" style="background: #febc2e" />
        <span class="vp-tdot" style="background: #28c840" />
        <span class="vp-terminal-title">~/projects/checkout · feat/AUTH-204</span>
      </div>
      <div class="vp-terminal-body">
        <div><span class="vp-acc">›</span> <strong>devflow commit</strong></div>
        <div class="vp-tspace" />
        <div><span class="vp-dim">?</span> <span class="vp-muted">Select files to stage</span> <span class="vp-dim">(2/4)</span></div>
        <div>  <span class="vp-acc">◉</span> src/auth/login.ts</div>
        <div>  <span class="vp-acc">◉</span> src/auth/session.ts</div>
        <div>  <span class="vp-dim">◯ tests/auth.test.ts</span></div>
        <div>  <span class="vp-dim">◯ CHANGELOG.md</span></div>
        <div class="vp-tspace" />
        <div><span class="vp-dim">?</span> <span class="vp-muted">Commit type</span> <span class="vp-acc">›</span> <strong>feat</strong> <span class="vp-dim">· a new feature</span></div>
        <div><span class="vp-dim">?</span> <span class="vp-muted">Scope</span> <span class="vp-acc">›</span> <strong>auth</strong> <span class="vp-dim">· (inferred from src/auth/**)</span></div>
        <div><span class="vp-dim">?</span> <span class="vp-muted">Subject</span> <span class="vp-acc">›</span> add biometric login<span class="vp-cursor" /></div>
        <div class="vp-tspace" />
        <div><span class="vp-dim">──── preview ────────────────────</span></div>
        <div><span class="vp-acc-2">feat</span>[<span class="vp-warn">AUTH-204</span>](<span class="vp-acc-2">auth</span>): add biometric login</div>
      </div>
    </div>
  </section>
</template>
