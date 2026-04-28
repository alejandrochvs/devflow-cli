<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Pebble from './Pebble.vue'

const expression = ref<'happy' | 'focused' | 'sleepy' | 'wow' | 'wink'>('happy')
const seq: Array<typeof expression.value> = ['happy', 'focused', 'wow', 'happy', 'wink', 'happy']
let i = 0
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    i = (i + 1) % seq.length
    expression.value = seq[i]
  }, 1800)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="vp-pebble-card">
    <div class="vp-pebble-eyebrow">
      <span class="vp-mono-tag">PEBBLE · DEVFLOW MASCOT</span>
    </div>
    <div class="vp-pebble-stage">
      <Pebble :size="240" :expression="expression" :show-branch="true" class="vp-pebble-bob" />
    </div>
    <div class="vp-pebble-caption">
      Otters hold hands so they don't drift apart while sleeping.<br />
      <span class="vp-dim">devflow's the same idea, for your team.</span>
    </div>
  </div>
</template>
