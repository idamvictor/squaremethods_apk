import { useState } from 'react'
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native'
import { Defs, LinearGradient, Path, Stop, Svg, Text as SvgText } from 'react-native-svg'
import { cn } from '@/lib/utils'
import type { DashboardGraphData, GraphDataPoint } from '@/services/users/users-types'

const CHART_WIDTH = Dimensions.get('window').width - 64
const CHART_HEIGHT = 140
const PAD_TOP = 12
const PAD_BOTTOM = 28
const PAD_X = 4
const INNER_W = CHART_WIDTH - PAD_X * 2
const INNER_H = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM

const TABS = [
  { key: 'sop_created' as const,          label: 'Job Aids' },
  { key: 'equipment_registered' as const, label: 'Equipment' },
  { key: 'total_task' as const,           label: 'Total Tasks' },
  { key: 'completed_task' as const,       label: 'Completed' },
]

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`

  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function buildPaths(points: GraphDataPoint[]) {
  if (points.length < 2) return { line: '', area: '' }

  const counts = points.map((p) => p.count)
  const minV = Math.min(...counts)
  const maxV = Math.max(...counts)
  const range = maxV - minV || 1

  const pts = points.map((p, i) => ({
    x: PAD_X + (i / (points.length - 1)) * INNER_W,
    y: PAD_TOP + INNER_H - ((p.count - minV) / range) * INNER_H,
  }))

  const line = smoothPath(pts)
  const bottom = CHART_HEIGHT - PAD_BOTTOM
  const area =
    line +
    ` L ${pts[pts.length - 1].x} ${bottom}` +
    ` L ${pts[0].x} ${bottom}` +
    ' Z'

  return { line, area, pts }
}

function dateLabel(date: string) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return date.slice(0, 6)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface TrendChartProps {
  graphData: DashboardGraphData
}

export function TrendChart({ graphData }: TrendChartProps) {
  const [activeTab, setActiveTab] = useState<keyof DashboardGraphData>('sop_created')

  const rawPoints = graphData[activeTab] ?? []
  const total = rawPoints.reduce((sum, p) => sum + p.count, 0)
  const { line, area, pts } = buildPaths(rawPoints) as {
    line: string
    area: string
    pts?: { x: number; y: number }[]
  }

  // Show at most 5 x-axis labels, evenly spaced
  const labelIndices: number[] = []
  if (rawPoints.length > 0) {
    const step = Math.max(1, Math.floor((rawPoints.length - 1) / 4))
    for (let i = 0; i < rawPoints.length; i += step) labelIndices.push(i)
    if (labelIndices[labelIndices.length - 1] !== rawPoints.length - 1) {
      labelIndices.push(rawPoints.length - 1)
    }
  }

  return (
    <View className="bg-white rounded-2xl p-4 gap-y-4">
      <Text className="text-base font-semibold text-gray-900">Activity Trend</Text>

      {/* Tab switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-x-2">
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-full px-3 py-1.5',
                activeTab === tab.key ? 'bg-blue-600' : 'bg-gray-100'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-medium',
                  activeTab === tab.key ? 'text-white' : 'text-gray-600'
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Stat summary */}
      <Text className="text-3xl font-bold text-gray-900">{total}</Text>

      {/* Chart */}
      {rawPoints.length >= 2 && pts ? (
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#208AEF" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#208AEF" stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Gradient fill */}
          <Path d={area} fill="url(#areaGrad)" />

          {/* Line */}
          <Path d={line} stroke="#208AEF" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* X-axis date labels */}
          {labelIndices.map((idx) => (
            <SvgText
              key={idx}
              x={pts[idx].x}
              y={CHART_HEIGHT - 6}
              fontSize={9}
              fill="#9CA3AF"
              textAnchor="middle"
            >
              {dateLabel(rawPoints[idx].date)}
            </SvgText>
          ))}
        </Svg>
      ) : (
        <View className="h-36 items-center justify-center">
          <Text className="text-sm text-gray-400">Not enough data to display</Text>
        </View>
      )}
    </View>
  )
}
