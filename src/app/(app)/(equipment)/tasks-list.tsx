import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useTasks } from '@/services/tasks/tasks-queries'
import type { Task } from '@/services/tasks/tasks-types'

function TaskCard({ item }: { item: Task }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(app)/(tasks)/[id]', params: { id: item.id } })}
      className="bg-white rounded-2xl p-4 shadow-sm mb-3 active:opacity-80"
    >
      <Text className="text-sm font-semibold text-gray-900 mb-1.5" numberOfLines={1}>
        {item.title}
      </Text>
      <View className="flex-row items-center gap-x-2 flex-wrap gap-y-1">
        <View className="bg-blue-100 rounded-full px-2 py-0.5">
          <Text className="text-xs font-medium text-blue-700">
            {item.jobAids.length} job aid{item.jobAids.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

export default function EquipmentTasksListScreen() {
  const insets = useSafeAreaInsets()
  const { equipment_id, title } = useLocalSearchParams<{ equipment_id: string; title: string }>()
  const { data, isLoading } = useTasks({ equipment_id })
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
          Tasks · {title}
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
          renderItem={({ item }) => <TaskCard item={item} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center gap-y-3 py-24">
              <Ionicons name="checkbox-outline" size={48} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No tasks attached</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
