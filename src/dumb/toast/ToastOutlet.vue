<script setup lang="ts">
import { useToastStore } from './toastStore'

const { removeToast, toasts } = useToastStore()

function toneClass(tone: string) {
  if (tone === 'success') {
    return 'alert-success'
  }

  if (tone === 'error') {
    return 'alert-error'
  }

  return 'alert-info'
}
</script>

<template>
  <div class="toast toast-top toast-center z-50">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="alert min-w-72 shadow-lg"
      :class="toneClass(toast.tone)"
      @click="removeToast(toast.id)"
    >
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

