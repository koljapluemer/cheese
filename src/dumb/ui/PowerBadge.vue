<script setup lang="ts">
defineProps<{
  power: number
  small?: boolean
}>()
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-full bg-primary px-2 py-1 font-semibold text-primary-content shadow-sm"
    :class="small ? 'min-w-7 text-xs' : 'min-w-8 text-sm'"
  >
    {{ power }}
  </span>
</template>
