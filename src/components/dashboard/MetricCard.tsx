import * as React from 'react'
import { Text, View } from 'react-native'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  value: number | undefined
  label: string
  color: string
  loading?: boolean
}

export function MetricCard({ value, label, color, loading }: MetricCardProps) {
  if (loading) {
    return <View className="flex-1 h-24 rounded-2xl bg-gray-100" />
  }

  return (
    <View className={cn('flex-1 rounded-2xl p-4 gap-y-1', color)}>
      <Text className="text-2xl font-bold text-gray-900">
        {value ?? '—'}
      </Text>
      <Text className="text-xs font-medium text-gray-600 leading-snug">{label}</Text>
    </View>
  )
}
