import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useContributionWeeks, type DayCell } from '@/hooks/use-contribution-weeks'
import { ContributionHeatmapGrid } from './ContributionHeatmapGrid'

const MIN_YEAR = 2025
const CURRENT_YEAR = new Date().getFullYear()

function handleDayPress(day: DayCell) {
  if (day.count <= 0 || day.isOutOfRange) return
  router.push(`/(app)/(contributions)?due_date=${day.key}` as any)
}

export function ContributionHeatmap() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const { weeks, monthLabels, isLoading } = useContributionWeeks({ year })

  const total = weeks.reduce(
    (sum, week) => sum + week.reduce((weekSum, day) => weekSum + (day.isOutOfRange ? 0 : day.count), 0),
    0,
  )

  return (
    <View className="bg-white rounded-2xl p-4 gap-y-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-900">Contributions</Text>
        <Text className="text-xs text-gray-400">{total} in {year}</Text>
      </View>

      {/* Year switcher */}
      <View className="flex-row items-center justify-center gap-x-4">
        <Pressable
          onPress={() => setYear((y) => y - 1)}
          disabled={year <= MIN_YEAR}
          hitSlop={8}
          className="w-7 h-7 items-center justify-center active:opacity-60"
        >
          <Ionicons name="chevron-back" size={16} color={year <= MIN_YEAR ? '#D1D5DB' : '#4B5563'} />
        </Pressable>
        <Text className="text-sm font-semibold text-gray-700 w-12 text-center">{year}</Text>
        <Pressable
          onPress={() => setYear((y) => y + 1)}
          disabled={year >= CURRENT_YEAR}
          hitSlop={8}
          className="w-7 h-7 items-center justify-center active:opacity-60"
        >
          <Ionicons
            name="chevron-forward"
            size={16}
            color={year >= CURRENT_YEAR ? '#D1D5DB' : '#4B5563'}
          />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="h-24 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <>
          <ContributionHeatmapGrid
            weeks={weeks}
            monthLabels={monthLabels}
            cellSize={16}
            gap={4}
            onDayPress={handleDayPress}
          />

          {total === 0 && <Text className="text-xs text-gray-400">No contributions in {year}.</Text>}
        </>
      )}
    </View>
  )
}
