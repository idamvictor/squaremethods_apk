import * as React from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { MetricCard } from './MetricCard'
import { JobCard } from '@/components/jobs/JobCard'
import { useDashboard, useProfile } from '@/services/users/users-queries'
import { useUserJobs } from '@/services/jobs/jobs-queries'
import { useAuthStore } from '@/store/auth-store'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function TechnicianDashboard() {
  const storedUser = useAuthStore((s) => s.user)
  const { data: profileData } = useProfile()
  const insets = useSafeAreaInsets()
  const user = profileData?.data ?? storedUser

  const {
    data: dashData,
    isLoading: dashLoading,
    isError: dashError,
    error: dashErrorObj,
    refetch: refetchDash,
    isRefetching,
  } = useDashboard()

  const {
    data: jobsData,
    isLoading: jobsLoading,
    refetch: refetchJobs,
  } = useUserJobs(user?.id ?? '', { limit: 10 })

  const stats = dashData?.data.stats
  const jobs = jobsData?.data ?? []

  const errorMessage = dashError
    ? ((dashErrorObj as any)?.response?.data?.message ?? (dashErrorObj as any)?.message ?? 'Unknown error')
    : null

  const handleRefresh = () => {
    refetchDash()
    refetchJobs()
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, gap: 16 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#208AEF" />
      }
    >
      {/* Greeting */}
      <View className="gap-y-1">
        <Text className="text-2xl font-bold text-gray-900">
          {getGreeting()}{user?.first_name ? `, ${user.first_name}` : ''} 👋
        </Text>
        <Text className="text-sm text-gray-500">Here are your assigned tasks</Text>
      </View>

      {/* Error state */}
      {dashError && (
        <View className="rounded-2xl border border-red-200 bg-red-50 p-4 gap-y-1">
          <Text className="text-sm font-semibold text-red-600">Failed to load dashboard data</Text>
          {errorMessage ? (
            <Text className="text-xs text-red-500">{errorMessage}</Text>
          ) : null}
          <Text className="text-xs text-red-400">Pull down to retry</Text>
        </View>
      )}

      {/* Scan QR card */}
      <Pressable
        onPress={() => router.push('/(app)/scan')}
        className="bg-blue-600 rounded-2xl p-4 flex-row items-center gap-x-3 active:opacity-80"
      >
        <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
          <Ionicons name="qr-code-outline" size={22} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-white">Scan Equipment</Text>
          <Text className="text-xs text-blue-100">Point your camera at a QR code</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
      </Pressable>

      {/* Metric cards — 2×2 grid */}
      <View className="gap-y-3">
        <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">My Tasks</Text>
        <View className="flex-row gap-x-3">
          <MetricCard
            value={stats?.total_tasks}
            label="Total Tasks"
            color="bg-blue-50"
            loading={dashLoading}
            onPress={() => router.push('/(app)/(tasks)')}
          />
          <MetricCard
            value={stats?.completed_tasks}
            label="Completed"
            color="bg-green-50"
            loading={dashLoading}
            onPress={() => router.push('/(app)/(tasks)')}
          />
        </View>
        <View className="flex-row gap-x-3">
          <MetricCard
            value={stats?.pending_tasks}
            label="Pending Tasks"
            color="bg-yellow-50"
            loading={dashLoading}
            onPress={() => router.push('/(app)/(tasks)')}
          />
          <MetricCard
            value={stats?.job_aid_created}
            label="Job Aids"
            color="bg-purple-50"
            loading={dashLoading}
            onPress={() => router.navigate('/(app)/(job-aids)')}
          />
        </View>
      </View>

      {/* Jobs list */}
      <View className="gap-y-3">
        <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          My Jobs
        </Text>

        {jobsLoading && (
          <View className="py-8 items-center">
            <ActivityIndicator color="#208AEF" />
          </View>
        )}

        {!jobsLoading && jobs.length === 0 && (
          <View className="rounded-2xl bg-white border border-gray-100 p-6 items-center">
            <Text className="text-sm text-gray-400">No jobs assigned yet</Text>
          </View>
        )}

        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </View>
    </ScrollView>
  )
}
