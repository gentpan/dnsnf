<template>
  <NuxtImg
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="loading"
    :format="format"
    :quality="quality"
    :sizes="sizes"
    :fit="fit"
    class="optimized-image"
    placeholder
  />
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  loading?: 'lazy' | 'eager'
  format?: 'webp' | 'jpg' | 'png' | 'svg'
  quality?: number
  sizes?: string
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

withDefaults(defineProps<Props>(), {
  loading: 'lazy',
  format: 'webp',
  quality: 80,
  fit: 'cover',
})
</script>

<style scoped>
.optimized-image {
  max-width: 100%;
  height: auto;
}
</style>
