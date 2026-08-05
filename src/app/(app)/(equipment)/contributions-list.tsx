import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useFailureModes } from '@/services/failure-mode/failure-mode-queries'
import type { FailureMode, FailureModeStatus } from '@/services/failure-mode/failure-mode-types'

const STATUS_BADGE: Record<FailureModeStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Closed' },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function FailureModeCard({ item }: { item: FailureMode }) {
  const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.open
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/(contributions)/[id]', params: { id: item.id } })}
      className="bg-white rounded-2xl p-4 shadow-sm mb-3 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-x-2">
        <Text className="flex-1 text-sm font-semibold text-gray-900" numberOfLines={1}>
          {item.title}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${badge.bg}`}>
          <Text className={`text-xs font-medium ${badge.text}`}>{badge.label}</Text>
        </View>
      </View>
      <Text className="text-xs text-gray-500 mt-1.5">Due {formatDate(item.due_date)}</Text>
    </Pressable>
  )
}

export default function EquipmentFailureModeListScreen() {
  const insets = useSafeAreaInsets()
  const { equipment_id, title } = useLocalSearchParams<{ equipment_id: string; title: string }>()
  const { data, isLoading } = useFailureModes({ equipment_id })
  const items = data?.data ?? []

  return (
    <View className="flex-1 bg-gray-50">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-gray-900" numberOfLines={1}>
          Contributions · {title}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
          renderItem={({ item }) => <FailureModeCard item={item} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-y-3 py-24">
              <Ionicons name="git-pull-request-outline" size={48} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No contributions recorded</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
