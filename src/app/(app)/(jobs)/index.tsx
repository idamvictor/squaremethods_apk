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
import { useJobs, useUserJobs, useDeleteJob } from '@/services/jobs/jobs-queries'
import { useUsers } from '@/services/users/users-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import type { Job, JobPriority, JobStatus } from '@/services/jobs/jobs-types'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin', 'user', 'viewer']

type StatusFilter = JobStatus | 'all'

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Cancelled', value: 'cancelled' },
]

const PRIORITY_FILTER_ITEMS: { label: string; value: JobPriority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  on_hold: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(dateStr: string, status: JobStatus) {
  if (status === 'completed' || status === 'cancelled') return false
  return new Date(dateStr) < new Date()
}

function JobCard({ job, onPress, onLongPress }: { job: Job; onPress: () => void; onLongPress: () => void }) {
  const overdue = isOverdue(job.due_date, job.status)

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="bg-white rounded-2xl p-4 shadow-sm active:opacity-80"
    >
      <View className="flex-row items-start gap-x-2.5">
        <View className={`w-2.5 h-2.5 rounded-full mt-1.5 ${PRIORITY_DOT[job.priority] ?? 'bg-gray-300'}`} />
        <View className="flex-1 gap-y-1.5">
          <View className="flex-row items-start justify-between gap-x-2">
            <Text className="flex-1 text-sm font-semibold text-gray-900" numberOfLines={1}>
              {job.title}
            </Text>
            <View className={`px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
              <Text className={`text-xs font-medium ${STATUS_COLORS[job.status]?.split(' ')[1] ?? 'text-gray-600'}`}>
                {STATUS_LABELS[job.status]}
              </Text>
            </View>
          </View>

          {job.equipment && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>
              📍 {job.equipment.name}
            </Text>
          )}

          <View className="flex-row items-center gap-x-3 flex-wrap">
            <Text className="text-xs text-gray-500">
              👤 {job.assignedUser?.first_name} {job.assignedUser?.last_name}
            </Text>
            <Text className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              📅 {formatDate(job.due_date)}{overdue ? ' · Overdue' : ''}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export default function JobsScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | 'all'>('all')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [assignedName, setAssignedName] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [filterPicker, setFilterPicker] = useState<'priority' | 'assigned' | 'equipment' | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: usersData } = useUsers({ page: 1, limit: 1000 })
  const assignedItems = (usersData?.data ?? []).map((u) => ({
    label: `${u.first_name} ${u.last_name}`,
    value: u.id,
  }))
  const equipmentFilterItems = Array.from(
    new Map(
      allJobs.filter((j) => j.equipment).map((j) => [j.equipment!.id, j.equipment!.name]),
    ).entries(),
  ).map(([value, label]) => ({ label, value }))

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setAllJobs([])
    }, 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [search])

  useEffect(() => {
    setPage(1)
    setAllJobs([])
  }, [statusFilter, priorityFilter, assignedFilter])

  function handleResetFilters() {
    setStatusFilter('all')
    setPriorityFilter('all')
    setAssignedFilter('')
    setAssignedName('')
    setEquipmentFilter('')
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
    setAllJobs([])
  }

  const params = {
    page,
    limit: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    assigned_to: assignedFilter || undefined,
    search: debouncedSearch || undefined,
  }

  const adminQuery = useJobs(isAdmin ? params : undefined)
  const techQuery = useUserJobs(
    !isAdmin ? (user?.id ?? '') : '',
    !isAdmin ? params : undefined,
  )

  const query = isAdmin ? adminQuery : techQuery
  const { mutate: deleteJob } = useDeleteJob()
  const visibleJobs = equipmentFilter
    ? (page === 1 ? (query.data?.data ?? allJobs) : allJobs).filter(
        (j) => j.equipment?.id === equipmentFilter,
      )
    : page === 1 ? (query.data?.data ?? allJobs) : allJobs

  useEffect(() => {
    const newJobs = query.data?.data ?? []
    if (page === 1) {
      setAllJobs(newJobs)
    } else {
      setAllJobs((prev) => {
        const existingIds = new Set(prev.map((j) => j.id))
        return [...prev, ...newJobs.filter((j) => !existingIds.has(j.id))]
      })
    }
  }, [query.data, page])

  const totalPages = query.data?.pagination?.pages ?? 1
  const hasMore = page < totalPages

  const handleLoadMore = useCallback(() => {
    if (!query.isFetching && hasMore) {
      setPage((p) => p + 1)
    }
  }, [query.isFetching, hasMore])

  const handleRefresh = useCallback(() => {
    setPage(1)
    query.refetch()
  }, [query])

  function handleLongPress(job: Job) {
    if (!isAdmin) return
    Alert.alert(job.title, undefined, [
      { text: 'Edit', onPress: () => router.push({ pathname: '/(app)/(jobs)/edit', params: { id: job.id } }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Job', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteJob(job.id) },
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
          <Text className="text-xl font-bold text-gray-900">Jobs</Text>
          {isAdmin && (
            <Pressable
              onPress={() => router.push('/(app)/(jobs)/create')}
              className="w-8 h-8 items-center justify-center rounded-full bg-blue-600 active:opacity-70"
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          )}
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
                statusFilter === f.value
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  statusFilter === f.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Priority / assignee / equipment filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2 -mx-4"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          <Pressable
            onPress={() => setFilterPicker('priority')}
            className={`flex-row items-center gap-x-1 px-3.5 py-1.5 rounded-full border ${
              priorityFilter !== 'all' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-xs font-medium ${priorityFilter !== 'all' ? 'text-white' : 'text-gray-600'}`}>
              {priorityFilter === 'all' ? 'Priority' : PRIORITY_FILTER_ITEMS.find((p) => p.value === priorityFilter)?.label}
            </Text>
            <Ionicons name="chevron-down" size={12} color={priorityFilter !== 'all' ? '#FFFFFF' : '#9CA3AF'} />
          </Pressable>

          <Pressable
            onPress={() => setFilterPicker('assigned')}
            className={`flex-row items-center gap-x-1 px-3.5 py-1.5 rounded-full border ${
              assignedFilter ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-xs font-medium ${assignedFilter ? 'text-white' : 'text-gray-600'}`} numberOfLines={1}>
              {assignedFilter ? assignedName : 'Assigned To'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={assignedFilter ? '#FFFFFF' : '#9CA3AF'} />
          </Pressable>

          <Pressable
            onPress={() => setFilterPicker('equipment')}
            className={`flex-row items-center gap-x-1 px-3.5 py-1.5 rounded-full border ${
              equipmentFilter ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-xs font-medium ${equipmentFilter ? 'text-white' : 'text-gray-600'}`} numberOfLines={1}>
              {equipmentFilter ? equipmentFilterItems.find((e) => e.value === equipmentFilter)?.label : 'Equipment'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={equipmentFilter ? '#FFFFFF' : '#9CA3AF'} />
          </Pressable>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || !!assignedFilter || !!equipmentFilter || !!search) && (
            <Pressable
              onPress={handleResetFilters}
              className="flex-row items-center gap-x-1 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white"
            >
              <Ionicons name="refresh" size={12} color="#6B7280" />
              <Text className="text-xs font-medium text-gray-600">Reset</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-9 mt-3 gap-x-2">
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search jobs…"
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

      {/* List */}
      {query.isLoading && page === 1 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={visibleJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          onRefresh={handleRefresh}
          refreshing={query.isFetching && page === 1}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push({ pathname: '/(app)/(jobs)/[id]', params: { id: item.id } })}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          ListFooterComponent={
            query.isFetching && page > 1
              ? <ActivityIndicator color="#208AEF" style={{ marginVertical: 12 }} />
              : null
          }
          ListEmptyComponent={
            !query.isFetching ? (
              <View className="flex-1 items-center justify-center py-24">
                <Ionicons name="briefcase-outline" size={40} color="#D1D5DB" />
                <Text className="mt-3 text-sm text-gray-400">No jobs found</Text>
              </View>
            ) : null
          }
        />
      )}

      <BottomSheetPicker
        visible={filterPicker === 'priority'}
        onClose={() => setFilterPicker(null)}
        title="Filter by Priority"
        items={PRIORITY_FILTER_ITEMS}
        selected={priorityFilter === 'all' ? null : priorityFilter}
        onSelect={(value) => {
          setPriorityFilter(value as JobPriority)
          setFilterPicker(null)
        }}
      />

      <BottomSheetPicker
        visible={filterPicker === 'assigned'}
        onClose={() => setFilterPicker(null)}
        title="Filter by Assigned To"
        items={assignedItems}
        selected={assignedFilter || null}
        searchable
        onSelect={(value) => {
          const found = assignedItems.find((a) => a.value === value)
          setAssignedFilter(value)
          setAssignedName(found?.label ?? '')
          setFilterPicker(null)
        }}
      />

      <BottomSheetPicker
        visible={filterPicker === 'equipment'}
        onClose={() => setFilterPicker(null)}
        title="Filter by Equipment"
        items={equipmentFilterItems}
        selected={equipmentFilter || null}
        onSelect={(value) => {
          setEquipmentFilter(value)
          setFilterPicker(null)
        }}
      />
    </View>
  )
}
