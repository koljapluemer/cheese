<script setup lang="ts">
import { computed } from 'vue'

import { getCheeseByName } from '@/entities/cheese/cheeseCatalog'

import { buildRenderedWheelSegments, getLabelPosition } from './wheelGeometry'
import type { WheelSegment } from './wheelTypes'

const props = defineProps<{
  isSpinning: boolean
  rotationDegrees: number
  segments: WheelSegment[]
}>()

const segmentColors = ['#f4d35e', '#ee964b', '#f95738', '#6ca6c1', '#7cb518']
const renderedSegments = computed(() => buildRenderedWheelSegments(props.segments, 100))

function labelFor(segment: WheelSegment) {
  if (segment.reward.kind === 'cows') {
    return `${segment.reward.cows} cows`
  }

  if (segment.reward.kind === 'destroy') {
    return 'Lose 1'
  }

  return segment.reward.source === 'cheap' ? 'Cheap' : 'Top'
}

function cheeseFor(segment: WheelSegment) {
  if (segment.reward.kind !== 'cheese') {
    return null
  }

  return getCheeseByName(segment.reward.cheeseName)
}
</script>

<template>
  <div class="relative mx-auto w-full max-w-xs">
    <div
      class="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-b-[20px] border-x-transparent border-b-base-content"
    ></div>

    <div class="rounded-full bg-base-200 p-3 shadow-sm">
      <svg
        viewBox="-120 -120 240 240"
        class="w-full"
        :style="{
          transform: `rotate(${rotationDegrees}deg)`,
          transition: isSpinning ? 'transform 4200ms cubic-bezier(0.18, 0.9, 0.2, 1)' : 'none',
        }"
      >
        <g v-for="(item, index) in renderedSegments" :key="item.segment.id">
          <path :d="item.path" :fill="segmentColors[index % segmentColors.length]" stroke="#fff8eb" stroke-width="2" />

          <template v-if="item.segment.reward.kind === 'cheese'">
            <image
              v-if="cheeseFor(item.segment)"
              :href="cheeseFor(item.segment)?.imagePath"
              :x="getLabelPosition(62, item.labelAngle).x - 16"
              :y="getLabelPosition(62, item.labelAngle).y - 16"
              height="32"
              preserveAspectRatio="xMidYMid slice"
              width="32"
            />
            <text
              :x="getLabelPosition(82, item.labelAngle).x"
              :y="getLabelPosition(82, item.labelAngle).y + 2"
              fill="#1f1b16"
              font-size="8"
              font-weight="700"
              text-anchor="middle"
            >
              {{ labelFor(item.segment) }}
            </text>
          </template>

          <text
            v-else
            :x="getLabelPosition(72, item.labelAngle).x"
            :y="getLabelPosition(72, item.labelAngle).y"
            fill="#1f1b16"
            font-size="10"
            font-weight="700"
            text-anchor="middle"
          >
            <tspan :x="getLabelPosition(72, item.labelAngle).x" dy="0">{{ labelFor(item.segment) }}</tspan>
          </text>
        </g>

        <circle cx="0" cy="0" fill="#fff8eb" r="24" stroke="#1f1b16" stroke-width="2" />
        <text x="0" y="-2" fill="#1f1b16" font-size="11" font-weight="700" text-anchor="middle">Wheel</text>
        <text x="0" y="11" fill="#7a4f01" font-size="8" font-weight="600" text-anchor="middle">Spin</text>
      </svg>
    </div>
  </div>
</template>
