<script setup lang="ts">
import QRCode from 'qrcode'
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ offerId: string; open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const qrDataUrl = ref('')
const inviteUrl = ref('')

async function generateQr() {
  inviteUrl.value = `${window.location.origin}/fight?invite=${props.offerId}`
  qrDataUrl.value = await QRCode.toDataURL(inviteUrl.value, { margin: 2, width: 256 })
}

onMounted(generateQr)
watch(() => props.offerId, generateQr)
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': open }" @click.self="emit('close')">
    <div class="modal-box flex flex-col items-center gap-4">
      <h3 class="text-lg font-bold">Invite to Fight</h3>
      <div v-if="!qrDataUrl" class="h-64 w-64 animate-pulse rounded-box bg-base-300" />
      <img v-else :src="qrDataUrl" alt="Fight invite QR code" class="rounded-box" width="256" height="256" />
      <p class="text-center text-sm text-base-content/70">Scan to join and fight you</p>
      <button type="button" class="btn btn-block" @click="emit('close')">Close</button>
    </div>
  </dialog>
</template>
