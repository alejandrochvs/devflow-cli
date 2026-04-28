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
