<script setup lang="ts">
import type { Cheese } from '@/entities/cheese/cheeseCatalog'

import PowerBadge from '@/dumb/ui/PowerBadge.vue'

defineProps<{
  caption?: string
  cheese: Cheese
  disabled?: boolean
  faded?: boolean
  mini?: boolean
  selected?: boolean
  spinning?: boolean
}>()

defineEmits<{
  choose: []
}>()
</script>

<template>
  <button
    type="button"
    class="w-full rounded-box border bg-base-100 text-left shadow-sm transition"
    :class="[
      mini ? 'p-2' : 'p-3',
      selected ? 'border-primary ring-2 ring-primary/20' : 'border-base-300',
      faded ? 'opacity-35' : '',
      disabled ? 'cursor-default' : 'hover:border-primary',
    ]"
    :disabled="disabled"
    @click="$emit('choose')"
  >
    <div class="space-y-2">
      <div class="relative overflow-hidden rounded-box bg-base-200">
        <img
          :src="cheese.imagePath"
          :alt="cheese.name"
          class="aspect-square w-full object-cover"
          :class="spinning ? 'animate-[spin_0.65s_linear_infinite]' : ''"
        />
        <div class="absolute bottom-2 right-2">
          <PowerBadge :power="cheese.power" :small="mini" />
        </div>
      </div>
      <div class="space-y-1">
        <p class="truncate font-medium" :class="mini ? 'text-xs' : 'text-sm'">{{ cheese.name }}</p>
        <p v-if="caption" class="text-xs text-base-content/60">{{ caption }}</p>
      </div>
    </div>
  </button>
</template>
