<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import PebbleCard from './components/PebbleCard.vue'
import HomeHeroInfo from './components/HomeHeroInfo.vue'
import TerminalDemo from './components/TerminalDemo.vue'
import Commands from './components/Commands.vue'
import CtaCard from './components/CtaCard.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
const isHome = frontmatter.value.layout === 'home'
</script>

<template>
  <Layout>
    <template v-if="isHome" #home-hero-info>
      <HomeHeroInfo />
    </template>
    <template v-if="isHome" #home-hero-image>
      <PebbleCard />
    </template>
    <template v-if="isHome" #home-features-after>
      <TerminalDemo />
      <Commands />
      <CtaCard />
    </template>
  </Layout>
</template>

<style scoped>
/*
 * On mobile, VitePress's .main is a flex item with flex-shrink:0 and
 * min-width:auto. The install button's default white-space:nowrap sets
 * a wide min-content that expands .main beyond the viewport.
 * :deep() pierces VitePress scoped CSS (higher specificity than their
 * [data-v-xxx] attribute selector), forcing min-width:0 so the cross-axis
 * stretch alignment can properly constrain .main to the container width.
 */
@media (max-width: 959px) {
  :deep(.vp-pebble-caption),
  :deep(.vp-mono-tag) {
    display: none;
  }
  :deep(.VPHero .image-container) {
    width: 100%;
    height: auto;
    max-height: 220px;
    overflow: hidden;
  }
  :deep(.VPHero .main) {
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }
  :deep(.VPHero .main .vp-hero-tagline) {
    max-width: 100%;
    width: 100%;
    word-break: break-word;
  }
  :deep(.VPHero .main .vp-hero-cta) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  :deep(.VPHero .main .vp-btn) {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    justify-content: center;
    overflow: hidden;
  }
  :deep(.VPHero .main .vp-install-text) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
}
</style>
