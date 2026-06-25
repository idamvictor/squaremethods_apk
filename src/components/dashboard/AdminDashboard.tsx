import * as React from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native'
import { MetricCard } from './MetricCard'
import { TrendChart } from './TrendChart'
import { useDashboard, useProfile } from '@/services/users/users-queries'
import { useAuthStore } from '@/store/auth-store'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function AdminDashboard() {
  const storedUser = useAuthStore((s) => s.user)
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard()
  const { data: profileData } = useProfile()

  const user = profileData?.data ?? storedUser
  const stats = data?.data.stats
  const graphData = data?.data.graphData

  const errorMessage = isError
    ? ((error as any)?.response?.data?.message ?? (error as any)?.message ?? 'Unknown error')
    : null

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#208AEF" />
      }
    >
      {/* Greeting */}
      <View className="gap-y-1 pt-2">
        <Text className="text-2xl font-bold text-gray-900">
          {getGreeting()}{user?.first_name ? `, ${user.first_name}` : ''} 👋
        </Text>
        <Text className="text-sm text-gray-500">Here's what's happening today</Text>
      </View>

      {/* Error state */}
      {isError && (
        <View className="rounded-2xl border border-red-200 bg-red-50 p-4 gap-y-1">
          <Text className="text-sm font-semibold text-red-600">Failed to load dashboard data</Text>
          {errorMessage ? (
            <Text className="text-xs text-red-500">{errorMessage}</Text>
          ) : null}
          <Text className="text-xs text-red-400">Pull down to retry</Text>
        </View>
      )}

      {/* Metric cards — 2-col grid */}
      <View className="gap-y-3">
        <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Overview</Text>
        <View className="flex-row gap-x-3">
          <MetricCard
            value={stats?.job_aid_created}
            label="Job Aids Created"
            color="bg-blue-50"
            loading={isLoading}
          />
          <MetricCard
            value={stats?.total_equipment}
            label="Total Equipment"
            color="bg-purple-50"
            loading={isLoading}
          />
        </View>
        <View className="flex-row gap-x-3">
          <MetricCard
            value={stats?.total_tasks}
            label="Total Tasks"
            color="bg-orange-50"
            loading={isLoading}
          />
          <MetricCard
            value={stats?.completed_tasks}
            label="Completed Tasks"
            color="bg-green-50"
            loading={isLoading}
          />
        </View>
        <View className="flex-row gap-x-3">
          <MetricCard
            value={stats?.pending_tasks}
            label="Pending Tasks"
            color="bg-yellow-50"
            loading={isLoading}
          />
          <View className="flex-1" />
        </View>
      </View>

      {/* Trend chart */}
      {isLoading && (
        <View className="h-64 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      )}
      {graphData && <TrendChart graphData={graphData} />}
    </ScrollView>
  )
}
