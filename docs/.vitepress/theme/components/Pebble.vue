<script setup lang="ts">
withDefaults(defineProps<{
  size?: number
  expression?: 'happy' | 'focused' | 'sleepy' | 'wow' | 'wink'
  showBranch?: boolean
  accent?: string
  dark?: string
  light?: string
}>(), {
  size: 200,
  expression: 'happy',
  showBranch: false,
  accent: '#ff9a3c',
  dark: '#1c1710',
  light: '#fbe0bc',
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 220 220" fill="none" style="overflow: visible">
    <!-- head -->
    <path
      d="M 110 30 C 60 30, 36 60, 36 95 C 36 125, 50 145, 70 152 C 80 162, 95 168, 110 168 C 125 168, 140 162, 150 152 C 170 145, 184 125, 184 95 C 184 60, 160 30, 110 30 Z"
      :fill="accent"
    />
    <!-- ears -->
    <ellipse cx="58" cy="52" rx="11" ry="9" :fill="accent" />
    <ellipse cx="162" cy="52" rx="11" ry="9" :fill="accent" />
    <ellipse cx="58" cy="52" rx="5" ry="4" :fill="dark" />
    <ellipse cx="162" cy="52" rx="5" ry="4" :fill="dark" />
    <!-- eye patches -->
    <ellipse cx="88" cy="96" rx="14" ry="13" :fill="light" opacity="0.55" />
    <ellipse cx="132" cy="96" rx="14" ry="13" :fill="light" opacity="0.55" />
    <!-- muzzle -->
    <ellipse cx="110" cy="138" rx="38" ry="26" :fill="light" />
    <!-- nose -->
    <path d="M 100 122 Q 110 132, 120 122 Q 116 117, 110 116 Q 104 117, 100 122 Z" :fill="dark" />
    <!-- philtrum -->
    <line x1="110" y1="128" x2="110" y2="138" :stroke="dark" stroke-width="2" stroke-linecap="round" />
    <!-- whisker dots -->
    <circle cx="92" cy="134" r="1.4" :fill="dark" />
    <circle cx="86" cy="140" r="1.4" :fill="dark" />
    <circle cx="90" cy="146" r="1.4" :fill="dark" />
    <circle cx="128" cy="134" r="1.4" :fill="dark" />
    <circle cx="134" cy="140" r="1.4" :fill="dark" />
    <circle cx="130" cy="146" r="1.4" :fill="dark" />
    <!-- whiskers -->
    <g :stroke="dark" stroke-width="1.2" stroke-linecap="round" opacity="0.55">
      <line x1="86" y1="138" x2="68" y2="134" />
      <line x1="86" y1="142" x2="66" y2="144" />
      <line x1="134" y1="138" x2="152" y2="134" />
      <line x1="134" y1="142" x2="154" y2="144" />
    </g>

    <!-- eyes: happy -->
    <template v-if="expression === 'happy'">
      <path d="M82 96 Q 88 90, 94 96" :stroke="dark" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <path d="M126 96 Q 132 90, 138 96" :stroke="dark" stroke-width="3.5" stroke-linecap="round" fill="none" />
    </template>
    <!-- eyes: focused -->
    <template v-else-if="expression === 'focused'">
      <circle cx="88" cy="96" r="4" :fill="dark" />
      <circle cx="132" cy="96" r="4" :fill="dark" />
      <circle cx="89" cy="94" r="1.4" :fill="light" />
      <circle cx="133" cy="94" r="1.4" :fill="light" />
    </template>
    <!-- eyes: sleepy -->
    <template v-else-if="expression === 'sleepy'">
      <path d="M80 98 Q 88 96, 96 98" :stroke="dark" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M124 98 Q 132 96, 140 98" :stroke="dark" stroke-width="3" stroke-linecap="round" fill="none" />
    </template>
    <!-- eyes: wow -->
    <template v-else-if="expression === 'wow'">
      <circle cx="88" cy="96" r="6" :fill="dark" />
      <circle cx="132" cy="96" r="6" :fill="dark" />
      <circle cx="90" cy="94" r="1.8" :fill="light" />
      <circle cx="134" cy="94" r="1.8" :fill="light" />
    </template>
    <!-- eyes: wink -->
    <template v-else-if="expression === 'wink'">
      <path d="M82 96 Q 88 90, 94 96" :stroke="dark" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <circle cx="132" cy="96" r="4" :fill="dark" />
    </template>

    <!-- mouth: happy -->
    <template v-if="expression === 'happy' || expression === 'wink'">
      <path d="M110 138 L 110 144 M 110 144 Q 102 148, 98 142 M 110 144 Q 118 148, 122 142" :stroke="dark" stroke-width="2.4" stroke-linecap="round" fill="none" />
    </template>
    <!-- mouth: focused -->
    <template v-else-if="expression === 'focused'">
      <path d="M104 144 L 116 144" :stroke="dark" stroke-width="2.4" stroke-linecap="round" />
    </template>
    <!-- mouth: sleepy -->
    <template v-else-if="expression === 'sleepy'">
      <path d="M104 144 Q 110 142, 116 144" :stroke="dark" stroke-width="2.4" stroke-linecap="round" fill="none" />
    </template>
    <!-- mouth: wow -->
    <template v-else-if="expression === 'wow'">
      <ellipse cx="110" cy="144" rx="3" ry="4" :fill="dark" />
    </template>

    <!-- branch (optional) -->
    <template v-if="showBranch">
      <ellipse cx="68" cy="178" rx="14" ry="10" fill="#d96d1f" />
      <ellipse cx="152" cy="178" rx="14" ry="10" fill="#d96d1f" />
      <line x1="56" y1="178" x2="164" y2="178" :stroke="dark" stroke-width="3" stroke-linecap="round" />
      <circle cx="110" cy="178" r="6" :fill="accent" :stroke="dark" stroke-width="2.5" />
      <circle cx="84" cy="178" r="4" :fill="dark" />
      <circle cx="138" cy="178" r="4" :fill="dark" />
    </template>
  </svg>
</template>
