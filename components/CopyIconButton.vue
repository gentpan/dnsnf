<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    copied?: boolean
    copyTitle?: string
    copiedTitle?: string
    ariaLabel?: string
    disabled?: boolean
  }>(),
  {
    copied: false,
    copyTitle: "Copy",
    copiedTitle: "Copied",
    ariaLabel: "Copy",
    disabled: false,
  },
)

defineEmits<{
  (e: "click"): void
}>()
</script>

<template>
  <button
    type="button"
    class="dns-copy-btn"
    :title="copied ? copiedTitle : copyTitle"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span class="dns-copy-tip" :class="{ 'is-visible': copied }">{{ copiedTitle }}</span>
    <i :class="copied ? 'fa-solid fa-check' : 'fa-regular fa-clipboard'" aria-hidden="true"></i>
  </button>
</template>
