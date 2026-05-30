<script setup lang="ts">
defineProps<{
  cheese: {
    imagePath: string
    license: string
    name: string
    source: string
  }
  compact?: boolean
}>()

defineEmits<{
  choose: [cheeseName: string]
}>()
</script>

<template>
  <button
    type="button"
    class="card border border-base-300 bg-base-100 text-left shadow-sm transition hover:border-primary"
    @click="$emit('choose', cheese.name)"
  >
    <figure class="aspect-square overflow-hidden bg-base-200">
      <img :src="cheese.imagePath" :alt="cheese.name" class="h-full w-full object-cover" />
    </figure>
    <div class="card-body gap-2" :class="compact ? 'p-3' : 'p-4'">
      <h3 class="text-sm font-semibold leading-tight">{{ cheese.name }}</h3>
      <a
        class="text-[11px] text-base-content/60 underline"
        :href="cheese.source"
        rel="noreferrer"
        target="_blank"
        @click.stop
      >
        Wikipedia contributors · {{ cheese.license }}
      </a>
    </div>
  </button>
</template>
