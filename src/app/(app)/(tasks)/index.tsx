import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTasks, useDeleteTask } from '@/services/tasks/tasks-queries'
import type { Task } from '@/services/tasks/tasks-types'

type JobAidFilter = 'all' | 'with' | 'without'

const FILTER_OPTIONS: { label: string; value: JobAidFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'With Job Aids', value: 'with' },
  { label: 'Without Job Aids', value: 'without' },
]

function TaskCard({
  task,
  onPress,
  onLongPress,
}: {
  task: Task
  onPress: () => void
  onLongPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="bg-white rounded-2xl p-4 shadow-sm active:opacity-80"
    >
      <Text className="text-sm font-semibold text-gray-900 mb-1.5" numberOfLines={1}>
        {task.title}
      </Text>
      <View className="flex-row items-center gap-x-2 flex-wrap gap-y-1">
        <View className="bg-blue-100 rounded-full px-2 py-0.5">
          <Text className="text-xs font-medium text-blue-700">
            {task.jobAids.length} job aid{task.jobAids.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {task.equipments.length > 0 && (
          <Text className="text-xs text-gray-400">
            📍 {task.equipments.length} equipment
          </Text>
        )}
      </View>
    </Pressable>
  )
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [jobAidFilter, setJobAidFilter] = useState<JobAidFilter>('all')
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState<Task[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSearch = useRef('')

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (search !== prevSearch.current) {
        prevSearch.current = search
        setPage(1)
        setAllItems([])
      }
      setDebouncedSearch(search)
    }, 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [search])

  const { data, isLoading, isFetching, refetch } = useTasks({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  })
  const { mutate: deleteTask } = useDeleteTask()

  useEffect(() => {
    if (!data?.data) return
    if (page === 1) {
      setAllItems(data.data)
    } else {
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((t) => t.id))
        const newItems = data.data.filter((t) => !existingIds.has(t.id))
        return [...prev, ...newItems]
      })
    }
  }, [data, page])

  const displayItems = jobAidFilter === 'all'
    ? allItems
    : jobAidFilter === 'with'
      ? allItems.filter((t) => t.jobAids.length > 0)
      : allItems.filter((t) => t.jobAids.length === 0)

  const totalPages = data?.pagination?.pages ?? 1
  const hasMore = page < totalPages

  const handleEndReached = useCallback(() => {
    if (hasMore && !isFetching) setPage((p) => p + 1)
  }, [hasMore, isFetching])

  const handleRefresh = useCallback(() => {
    setPage(1)
    setAllItems([])
    refetch()
  }, [refetch])

  function handleLongPress(task: Task) {
    Alert.alert(task.title, undefined, [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/(app)/(tasks)/edit', params: { id: task.id } }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Task', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Dark status bar fill */}
      <View style={{ height: insets.top }} className="bg-black" />

      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-3">
            <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
            <Text className="text-xl font-bold text-gray-900">Tasks</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/(tasks)/create')}
            className="w-8 h-8 items-center justify-center rounded-full bg-blue-600 active:opacity-70"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-1"
          contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
        >
          {FILTER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setJobAidFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full border ${
                jobAidFilter === opt.value
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  jobAidFilter === opt.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-9 mt-3 gap-x-2">
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tasks…"
            className="flex-1 text-sm text-gray-800"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading && page === 1 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          onRefresh={handleRefresh}
          refreshing={isFetching && page === 1}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => router.push({ pathname: '/(app)/(tasks)/[id]', params: { id: item.id } })}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          ListFooterComponent={
            isFetching && page > 1 ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#208AEF" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24">
              <Ionicons name="checkbox-outline" size={40} color="#D1D5DB" />
              <Text className="mt-3 text-sm text-gray-400">No tasks found</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
