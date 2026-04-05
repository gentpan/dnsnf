<script setup lang="ts">
const route = useRoute();

await navigateTo({ path: "/reverse-ns", query: { ...route.query } }, { replace: true, redirectCode: 301 });
</script>

<template>
  <div />
</template>
