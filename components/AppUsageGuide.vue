<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    points: string[]
    tags?: string[]
  }>(),
  {
    description: '',
    tags: () => [],
  },
)
</script>

<template>
  <section class="usage-guide">
    <div class="usage-guide-head">
      <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
      <strong>{{ title }}</strong>
    </div>
    <p v-if="description" class="usage-guide-desc">{{ description }}</p>
    <ul class="usage-guide-list">
      <li v-for="(point, idx) in points" :key="`${title}-${idx}`" class="usage-guide-item">
        <span class="usage-guide-index">{{ idx + 1 }}</span>
        <span class="usage-guide-text">{{ point }}</span>
      </li>
    </ul>
    <div v-if="tags.length > 0" class="usage-guide-tags">
      <span v-for="tag in tags" :key="`${title}-${tag}`" class="usage-guide-tag">{{ tag }}</span>
    </div>
  </section>
</template>

<style scoped>
.usage-guide {
  margin: 14px 0;
  border: 1px solid var(--panel-border);
  background: var(--app-surface);
  padding: 16px 18px;
}

.usage-guide-head {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--app-accent);
  font-size: 15px;
  font-weight: 700;
}

.usage-guide-desc {
  margin: 10px 0 0;
  color: var(--app-text-soft);
  font-size: 14px;
  line-height: 1.65;
}

.usage-guide-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-guide-item {
  width: 100%;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--app-surface-2) 88%, transparent);
  padding: 10px 12px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.usage-guide-index {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--app-accent) 12%, transparent);
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.usage-guide-text {
  color: var(--app-text);
  font-size: 13px;
  line-height: 1.7;
}

.usage-guide-tags {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.usage-guide-tag {
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--app-accent) 12%, transparent);
  color: var(--app-accent);
  font-size: 12px;
  line-height: 1;
  padding: 7px 10px;
}

@media (max-width: 640px) {
  .usage-guide {
    padding: 14px;
  }
}
</style>
