<script setup lang="ts">
defineProps<{
  title: string
  rows: Array<Record<string, unknown>>
}>()
</script>

<template>
  <el-card class="record-table-card" shadow="never">
    <template #header>
      <strong>{{ title }}</strong>
    </template>
    <el-table v-if="rows.length" :data="rows" border>
      <el-table-column
        v-for="key in Object.keys(rows[0])"
        :key="key"
        :prop="key"
        :label="key"
      />
    </el-table>
    <el-empty v-else description="No records" :image-size="60" />
  </el-card>
</template>

<style scoped>
.record-table-card {
  margin-bottom: 16px;
}
</style>
