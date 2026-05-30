import type { WheelSegment } from './wheelTypes'

export interface RenderedWheelSegment {
  endAngle: number
  labelAngle: number
  path: string
  segment: WheelSegment
  startAngle: number
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

function polarToCartesian(radius: number, angle: number) {
  return {
    x: radius * Math.cos(toRadians(angle)),
    y: radius * Math.sin(toRadians(angle)),
  }
}

function buildSegmentPath(radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(radius, startAngle)
  const end = polarToCartesian(radius, endAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

  return `M 0 0 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
}

export function buildRenderedWheelSegments(segments: WheelSegment[], radius: number) {
  let currentAngle = -90

  return segments.map((segment) => {
    const arcSize = (segment.weight / 100) * 360
    const nextAngle = currentAngle + arcSize
    const renderedSegment = {
      endAngle: nextAngle,
      labelAngle: currentAngle + arcSize / 2,
      path: buildSegmentPath(radius, currentAngle, nextAngle),
      segment,
      startAngle: currentAngle,
    }

    currentAngle = nextAngle
    return renderedSegment
  }) satisfies RenderedWheelSegment[]
}

export function getWinningRotationDegrees(segments: WheelSegment[], winningSegmentId: string) {
  const renderedSegments = buildRenderedWheelSegments(segments, 100)
  const winningSegment = renderedSegments.find((segment) => segment.segment.id === winningSegmentId)

  if (!winningSegment) {
    return 0
  }

  return ((-90 - winningSegment.labelAngle) % 360 + 360) % 360
}

export function getLabelPosition(radius: number, angle: number) {
  return polarToCartesian(radius, angle)
}
