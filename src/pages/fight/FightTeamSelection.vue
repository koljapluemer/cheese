<script setup lang="ts">
import FightCheeseCard from './FightCheeseCard.vue'
import type { SelectableFightCheese } from './fightPageHelpers'

defineProps<{
  busy?: boolean
  cheeses: SelectableFightCheese[]
  selectedIds: string[]
  title: string
}>()

defineEmits<{
  cancel: []
  submit: []
  toggle: [instanceId: string]
}>()
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ title }}</h1>
      <span class="text-sm text-base-content/70">{{ selectedIds.length }}/3</span>
    </div>

    <button
      type="button"
      class="btn btn-primary btn-block"
      :disabled="busy || selectedIds.length !== 3"
      @click="$emit('submit')"
    >
      Start Fight
    </button>

    <div v-if="cheeses.length < 3" class="alert alert-info">
      <span>You need at least 3 cheeses.</span>
    </div>

    <div v-else class="grid grid-cols-2 gap-3">
      <FightCheeseCard
        v-for="item in cheeses"
        :key="item.instanceId"
        :cheese="item.cheese"
        :selected="selectedIds.includes(item.instanceId)"
        :caption="`Copy ${item.quantityIndex}`"
        @choose="$emit('toggle', item.instanceId)"
      />
    </div>

    <button
      v-if="cheeses.length >= 3"
      type="button"
      class="btn btn-primary btn-block"
      :disabled="busy || selectedIds.length !== 3"
      @click="$emit('submit')"
    >
      Start Fight
    </button>

    <button type="button" class="btn btn-ghost btn-block" :disabled="busy" @click="$emit('cancel')">
      Back
    </button>
  </section>
</template>
