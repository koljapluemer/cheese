<script setup lang="ts">
import cowIcon from '@/assets/cow.svg'

defineProps<{
  value: number
}>()
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <img :src="cowIcon" alt="" class="size-4" />
    <span>{{ value }}</span>
  </span>
</template>

