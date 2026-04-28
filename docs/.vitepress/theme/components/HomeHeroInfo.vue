<script setup lang="ts">
import { ref, onMounted } from 'vue'

const copied = ref(false)
const installCmd = 'npm i -D @alejandrochaves/devflow-cli'

function copy() {
  navigator.clipboard.writeText(installCmd).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  })
}
</script>

<template>
  <div class="vp-hero-custom">
    <div class="vp-hero-eyebrow">
      <span class="vp-pulse" aria-hidden="true" />
      <span>v1.8.0 — release flow shipped</span>
    </div>
    <h1 class="vp-hero-title">
      stay in<br />
      the <span class="vp-hero-accent">flow.</span>
    </h1>
    <p class="vp-hero-tagline">
      A guided CLI for branches, conventional commits, and PRs.<br />
      devflow runs the workflow your team already agreed on — so you can keep building.
    </p>
    <div class="vp-hero-cta">
      <a class="vp-btn vp-btn-primary" href="/getting-started">Get started →</a>
      <button class="vp-btn vp-btn-ghost vp-btn-mono" @click="copy" :title="copied ? 'Copied!' : 'Copy install command'">
        <span class="vp-btn-prompt">$</span>
        <span>{{ installCmd }}</span>
        <span class="vp-btn-copy">{{ copied ? '✓' : '⧉' }}</span>
      </button>
    </div>
    <div class="vp-hero-badges">
      <a href="https://www.npmjs.com/package/@alejandrochaves/devflow-cli">
        <img alt="npm" src="https://img.shields.io/npm/v/@alejandrochaves/devflow-cli?style=flat&color=ff9a3c&labelColor=1c1710&label=npm" />
      </a>
      <a href="https://www.npmjs.com/package/@alejandrochaves/devflow-cli">
        <img alt="downloads" src="https://img.shields.io/npm/dm/@alejandrochaves/devflow-cli?style=flat&color=ff9a3c&labelColor=1c1710&label=downloads" />
      </a>
      <a href="https://github.com/alejandrochvs/devflow-cli">
        <img alt="stars" src="https://img.shields.io/github/stars/alejandrochvs/devflow-cli?style=flat&color=ff9a3c&labelColor=1c1710&label=stars" />
      </a>
      <a href="https://github.com/alejandrochvs/devflow-cli/blob/main/LICENSE">
        <img alt="MIT" src="https://img.shields.io/npm/l/@alejandrochaves/devflow-cli?style=flat&color=ff9a3c&labelColor=1c1710&label=license" />
      </a>
    </div>
  </div>
</template>
