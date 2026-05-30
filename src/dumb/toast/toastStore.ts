import { readonly, ref } from 'vue'

export type ToastTone = 'error' | 'info' | 'success'

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

const toasts = ref<ToastItem[]>([])

function removeToast(id: string) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function showToast(message: string, tone: ToastTone = 'info') {
  const id = crypto.randomUUID()

  toasts.value = [...toasts.value, { id, message, tone }]

  window.setTimeout(() => {
    removeToast(id)
  }, 2600)
}

export function useToastStore() {
  return {
    removeToast,
    showToast,
    toasts: readonly(toasts),
  }
}

