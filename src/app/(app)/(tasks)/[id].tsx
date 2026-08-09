import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useTaskById, useDeleteTask } from '@/services/tasks/tasks-queries'
import { usePermissions } from '@/lib/permissions'
import type { JobAid, TaskEquipment } from '@/services/tasks/tasks-types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function JobAidRow({ jobAid, isLast }: { jobAid: JobAid; isLast: boolean }) {
  return (
    <View>
      <Pressable
        onPress={() => router.push({ pathname: '/(app)/(job-aids)/[id]', params: { id: jobAid.id } })}
        className="px-4 py-3 gap-y-1.5 active:bg-gray-50"
      >
        <Text className="text-sm font-medium text-gray-800" numberOfLines={2}>
          {jobAid.title}
        </Text>
        {!!jobAid.instruction && (
          <Text className="text-xs text-gray-500" numberOfLines={2}>
            {jobAid.instruction}
          </Text>
        )}
        <View className="flex-row items-center gap-x-1.5 flex-wrap gap-y-1">
          {!!jobAid.category && (
            <View className="bg-gray-100 rounded-full px-2 py-0.5">
              <Text className="text-xs text-gray-600">{jobAid.category}</Text>
            </View>
          )}
          <View
            className={`rounded-full px-2 py-0.5 ${
              jobAid.status === 'published' ? 'bg-green-100' : 'bg-amber-100'
            }`}
          >
            <Text
              className={`text-xs font-medium capitalize ${
                jobAid.status === 'published' ? 'text-green-700' : 'text-amber-700'
              }`}
            >
              {jobAid.status}
            </Text>
          </View>
          {jobAid.estimated_duration != null && (
            <View className="bg-blue-50 rounded-full px-2 py-0.5">
              <Text className="text-xs text-blue-600">{jobAid.estimated_duration}m</Text>
            </View>
          )}
          <View className="flex-row items-center gap-x-0.5">
            <Ionicons name="eye-outline" size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-400">{jobAid.view_count}</Text>
          </View>
          <View className="flex-row items-center gap-x-0.5">
            <Ionicons name="qr-code-outline" size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-400">{jobAid.scan_count}</Text>
          </View>
        </View>
      </Pressable>
      {!isLast && <View className="h-px bg-gray-100 ml-4" />}
    </View>
  )
}

function EquipmentRow({ equipment, isLast }: { equipment: TaskEquipment; isLast: boolean }) {
  return (
    <View>
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-gray-800 flex-1" numberOfLines={1}>
          {equipment.name}
        </Text>
        <Text className="text-xs text-gray-400 ml-2">{equipment.reference_code}</Text>
      </View>
      {!isLast && <View className="h-px bg-gray-100 ml-4" />}
    </View>
  )
}

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { data: task, isLoading, error } = useTaskById(id)
  const { mutate: deleteTask } = useDeleteTask()
  const { isAdmin } = usePermissions()

  function handleKebab() {
    Alert.alert('Task Actions', undefined, [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/(app)/(tasks)/edit', params: { id } }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Task', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteTask(id ?? '', { onSuccess: () => router.back() }),
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

  if (error || !task) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center gap-y-3" style={{ paddingTop: insets.top }}>
        <Text className="text-sm text-gray-400">Failed to load task</Text>
        <Pressable onPress={() => router.back()} className="px-4 py-2 bg-blue-600 rounded-xl">
          <Text className="text-sm text-white font-medium">Go back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3">
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-gray-900" numberOfLines={1}>
          {task.title}
        </Text>
        {isAdmin && (
          <Pressable onPress={handleKebab} hitSlop={8} className="active:opacity-60">
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Job Aids */}
        <View className="bg-white rounded-2xl overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-sm font-semibold text-gray-900">
              Job Aids ({task.jobAids.length})
            </Text>
          </View>
          {task.jobAids.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-sm text-gray-400">No job aids linked</Text>
            </View>
          ) : (
            task.jobAids.map((ja, index) => (
              <JobAidRow
                key={ja.id}
                jobAid={ja}
                isLast={index === task.jobAids.length - 1}
              />
            ))
          )}
        </View>

        {/* Equipment */}
        <View className="bg-white rounded-2xl overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-sm font-semibold text-gray-900">
              Equipment ({task.equipments.length})
            </Text>
          </View>
          {task.equipments.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-sm text-gray-400">No equipment linked</Text>
            </View>
          ) : (
            task.equipments.map((eq, index) => (
              <EquipmentRow
                key={eq.id}
                equipment={eq}
                isLast={index === task.equipments.length - 1}
              />
            ))
          )}
        </View>

        {/* Meta */}
        <Text className="text-xs text-gray-400 text-center">
          Created · {formatDate(task.createdAt)}
        </Text>
      </ScrollView>
    </View>
  )
}
