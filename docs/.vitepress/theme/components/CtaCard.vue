<script setup lang="ts">
import Pebble from './Pebble.vue'
</script>

<template>
  <section class="vp-cta">
    <div class="vp-cta-inner">
      <Pebble :size="120" expression="wow" class="vp-pebble-bob" />
      <h2>Ready to give git a hand?</h2>
      <p>
        Install devflow and run <code>npx devflow init</code> —
        you'll be on a clean conventional commit in 60 seconds.
      </p>
      <div class="vp-hero-cta">
        <a class="vp-btn vp-btn-primary" href="/getting-started">Install →</a>
        <a class="vp-btn vp-btn-ghost" href="https://github.com/alejandrochvs/devflow-cli">Star on GitHub</a>
      </div>
    </div>
  </section>
</template>
