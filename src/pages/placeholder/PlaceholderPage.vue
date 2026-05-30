<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <section class="space-y-3">
    <h1 class="text-2xl font-bold">{{ label }}</h1>
    <div class="rounded-box border border-dashed border-base-300 bg-base-100 p-4 text-sm text-base-content/70">
      Not ready yet.
    </div>
  </section>
</template>
