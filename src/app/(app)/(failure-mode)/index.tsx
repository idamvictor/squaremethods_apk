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
import { useAuthStore } from '@/store/auth-store'
import { useFailureModes, useDeleteFailureMode } from '@/services/failure-mode/failure-mode-queries'
import type { FailureMode, FailureModeStatus } from '@/services/failure-mode/failure-mode-types'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin', 'user', 'viewer']

type StatusFilter = FailureModeStatus | 'all'

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
]

const STATUS_STYLE: Record<FailureModeStatus, { badge: string; text: string; label: string }> = {
  open: { badge: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  in_progress: { badge: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
  resolved: { badge: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function FailureModeCard({
  item,
  onPress,
  onLongPress,
}: {
  item: FailureMode
  onPress: () => void
  onLongPress: () => void
}) {
  const statusStyle = STATUS_STYLE[item.status] ?? STATUS_STYLE.open
  const overdue = isOverdue(item.due_date)
  const dateLabel = formatDate(item.due_date)

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="bg-white rounded-2xl p-4 shadow-sm active:opacity-80"
    >
      <View className="flex-row items-start gap-x-2.5">
        <View className={`w-2.5 h-2.5 rounded-full mt-1.5 ${PRIORITY_DOT[item.priority] ?? 'bg-gray-300'}`} />
        <View className="flex-1 gap-y-1.5">
          <View className="flex-row items-start justify-between gap-x-2">
            <Text className="flex-1 text-sm font-semibold text-gray-900" numberOfLines={1}>
              {item.title}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${statusStyle.badge}`}>
              <Text className={`text-xs font-medium ${statusStyle.text}`}>{statusStyle.label}</Text>
            </View>
          </View>

          {item.equipment && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              📍 {item.equipment.name}
            </Text>
          )}

          <View className="flex-row items-center gap-x-3 flex-wrap">
            {item.reporter && (
              <Text className="text-xs text-gray-500">
                👤 {item.reporter.first_name} {item.reporter.last_name}
              </Text>
            )}
            {dateLabel && (
              <Text className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                📅 {dateLabel}{overdue ? ' · Overdue' : ''}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export default function FailureModeScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState<FailureMode[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setAllItems([])
    }, 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [search])

  useEffect(() => {
    setPage(1)
    setAllItems([])
  }, [statusFilter])

  const params = {
    page,
    limit: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
  }

  const { data, isLoading, isFetching, refetch } = useFailureModes(params)
  const { mutate: deleteItem } = useDeleteFailureMode()

  useEffect(() => {
    const newItems = data?.data ?? []
    if (page === 1) {
      setAllItems(newItems)
    } else {
      setAllItems((prev) => {
        const existing = new Set(prev.map((i) => i.id))
        return [...prev, ...newItems.filter((i) => !existing.has(i.id))]
      })
    }
  }, [data, page])

  const totalPages = data?.pagination?.pages ?? 1
  const hasMore = page < totalPages

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) setPage((p) => p + 1)
  }, [isFetching, hasMore])

  const handleRefresh = useCallback(() => {
    setPage(1)
    refetch()
  }, [refetch])

  function handleLongPress(item: FailureMode) {
    const canEdit = isAdmin || user?.id === item.reported_by
    if (!canEdit) return
    Alert.alert(item.title, undefined, [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/(app)/(failure-mode)/edit', params: { id: item.id } }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Failure Mode', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-3">
            <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
            <Text className="text-xl font-bold text-gray-900">Failure Mode</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/(failure-mode)/create')}
            className="w-8 h-8 items-center justify-center rounded-full bg-blue-600 active:opacity-70"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-4"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-full border ${
                statusFilter === f.value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`text-xs font-medium ${statusFilter === f.value ? 'text-white' : 'text-gray-600'}`}>
                {f.label}
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
            placeholder="Search failure modes…"
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
          data={allItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          onRefresh={handleRefresh}
          refreshing={isFetching && page === 1}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <FailureModeCard
              item={item}
              onPress={() => router.push({ pathname: '/(app)/(failure-mode)/[id]', params: { id: item.id } })}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          ListFooterComponent={
            isFetching && page > 1
              ? <ActivityIndicator color="#208AEF" style={{ marginVertical: 12 }} />
              : null
          }
          ListEmptyComponent={
            !isFetching ? (
              <View className="flex-1 items-center justify-center py-24">
                <Ionicons name="warning-outline" size={40} color="#D1D5DB" />
                <Text className="mt-3 text-sm text-gray-400">No failure modes found</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}
