import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  value: number | undefined
  label: string
  color: string
  loading?: boolean
  onPress?: () => void
}

export function MetricCard({ value, label, color, loading, onPress }: MetricCardProps) {
  if (loading) {
    return <View className="flex-1 h-24 rounded-2xl bg-gray-100" />
  }

  const card = (
    <View className={cn('flex-1 rounded-2xl p-4 gap-y-1', color)}>
      <Text className="text-2xl font-bold text-gray-900">
        {value ?? '—'}
      </Text>
      <Text className="text-xs font-medium text-gray-600 leading-snug">{label}</Text>
    </View>
  )

  return onPress ? (
    <Pressable onPress={onPress} className="flex-1 active:opacity-75">
      {card}
    </Pressable>
  ) : card
}
