import * as React from 'react'
import { useState } from 'react'
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native'
import { AreaChart } from 'react-native-gifted-charts'

// Guard against the library not being fully resolved at render time
const SafeAreaChart = AreaChart as React.ComponentType<React.ComponentProps<typeof AreaChart>> | undefined
import { cn } from '@/lib/utils'
import type { DashboardGraphData } from '@/services/users/users-types'

const CHART_WIDTH = Dimensions.get('window').width - 64

const TABS = [
  { key: 'sop_created' as const,           label: 'Job Aids' },
  { key: 'equipment_registered' as const,  label: 'Equipment' },
  { key: 'total_task' as const,            label: 'Total Tasks' },
  { key: 'completed_task' as const,        label: 'Completed' },
]

interface TrendChartProps {
  graphData: DashboardGraphData
}

export function TrendChart({ graphData }: TrendChartProps) {
  const [activeTab, setActiveTab] = useState<keyof DashboardGraphData>('sop_created')

  const rawPoints = graphData[activeTab] ?? []
  const chartData = rawPoints.map((p) => ({ value: p.count }))

  const total = rawPoints.reduce((sum, p) => sum + p.count, 0)

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
      {chartData.length > 1 && SafeAreaChart ? (
        <SafeAreaChart
          data={chartData}
          width={CHART_WIDTH}
          height={140}
          color="#208AEF"
          startFillColor="rgba(32,138,239,0.25)"
          endFillColor="rgba(32,138,239,0)"
          thickness={2}
          curved
          hideDataPoints
          hideRules
          hideAxesAndRules
          hideYAxisText
          xAxisColor="transparent"
          yAxisColor="transparent"
          noOfSections={4}
          areaChart
        />
      ) : (
        <View className="h-36 items-center justify-center">
          <Text className="text-sm text-gray-400">Not enough data to display</Text>
        </View>
      )}
    </View>
  )
}
