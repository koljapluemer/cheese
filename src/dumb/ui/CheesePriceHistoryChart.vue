<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJs,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'

interface PriceHistoryPoint {
  buyPrice: number
  capturedAt: string
  sellPrice: number
}

ChartJs.register(CategoryScale, Legend, LineElement, LinearScale, PointElement, Tooltip)

const props = defineProps<{
  history: PriceHistoryPoint[]
}>()

const labelFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
})

const chartData = computed(() => ({
  datasets: [
    {
      borderColor: '#2563eb',
      data: props.history.map((point) => point.buyPrice),
      label: 'Buy',
      tension: 0.2,
    },
    {
      borderColor: '#16a34a',
      data: props.history.map((point) => point.sellPrice),
      label: 'Sell',
      tension: 0.2,
    },
  ],
  labels: props.history.map((point) => labelFormatter.format(new Date(point.capturedAt))),
}))

const chartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  scales: {
    x: {
      ticks: {
        autoSkip: true,
        maxRotation: 0,
      },
    },
    y: {
      beginAtZero: false,
      ticks: {
        precision: 0,
      },
    },
  },
}
</script>

<template>
  <div class="h-56">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
