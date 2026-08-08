import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  useDeleteJobAid,
  useDuplicateJobAid,
  useJobAids,
} from '@/services/job-aids/job-aids-queries'
import type { JobAid } from '@/services/job-aids/job-aids-types'
import { useEquipment } from '@/services/equipment/equipment-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import { usePermissions } from '@/lib/permissions'
import { useJobAidApprovalActions } from '@/hooks/use-job-aid-approval-actions'

const LIMIT = 20

type StatusFilter = 'all' | 'draft' | 'pending_approval' | 'published'

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  return (
    <View className="bg-blue-100 rounded-full px-2 py-0.5">
      <Text className="text-xs font-medium text-blue-700 capitalize" numberOfLines={1}>
        {category}
      </Text>
    </View>
  )
}

function JobAidCard({
  item,
  isAdmin,
  onLongPress,
}: {
  item: JobAid
  isAdmin: boolean
  onLongPress: (actions: ReturnType<typeof useJobAidApprovalActions>) => void
}) {
  const approvalActions = useJobAidApprovalActions(item)
  const dotColor =
    item.status === 'published'
      ? 'bg-green-500'
      : item.status === 'pending_approval'
        ? 'bg-blue-500'
        : 'bg-amber-400'
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(app)/(job-aids)/[id]', params: { id: item.id } })
      }
      onLongPress={isAdmin ? () => onLongPress(approvalActions) : undefined}
      className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3 active:opacity-80"
    >
      {/* Cover image */}
      <View className="w-full bg-gray-100" style={{ aspectRatio: 16 / 9 }}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="document-text-outline" size={32} color="#D1D5DB" />
          </View>
        )}
        {/* Status dot */}
        <View className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white ${dotColor}`} />
      </View>

      {/* Card body */}
      <View className="px-4 py-3 gap-y-1">
        <View className="flex-row items-start justify-between gap-x-2">
          <Text className="flex-1 text-sm font-bold text-gray-900" numberOfLines={2}>
            {item.title}
          </Text>
          <CategoryBadge category={item.category} />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {item.creator
              ? `By ${item.creator.first_name} ${item.creator.last_name}`
              : 'Unknown author'}
          </Text>
          <View className="flex-row items-center gap-x-3">
            {item.estimated_duration != null && (
              <View className="flex-row items-center gap-x-1">
                <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                <Text className="text-xs text-gray-400">{item.estimated_duration} min</Text>
              </View>
            )}
            <View className="flex-row items-center gap-x-1">
              <Ionicons name="eye-outline" size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-400">{item.view_count}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function DuplicateModal({
  visible,
  originalTitle,
  onCancel,
  onConfirm,
  isLoading,
}: {
  visible: boolean
  originalTitle: string
  onCancel: () => void
  onConfirm: (title: string) => void
  isLoading: boolean
}) {
  const [title, setTitle] = useState('')
  useEffect(() => {
    if (visible) setTitle(`Copy of ${originalTitle}`)
  }, [visible, originalTitle])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-5 w-full gap-y-4">
          <Text className="text-base font-bold text-gray-900">Duplicate Job Aid</Text>
          <Text className="text-sm text-gray-500">Enter a title for the new copy</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className="h-11 border border-gray-200 rounded-xl px-3 text-sm text-gray-800"
            placeholderTextColor="#9CA3AF"
            autoFocus
          />
          <View className="flex-row gap-x-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 h-11 border border-gray-200 rounded-xl items-center justify-center"
            >
              <Text className="text-sm font-semibold text-gray-700">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(title.trim())}
              disabled={isLoading || !title.trim()}
              className="flex-1 h-11 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-sm font-semibold text-white">Duplicate</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function JobAidsScreen() {
  const insets = useSafeAreaInsets()
  const { isTechnician } = usePermissions()
  const isAdmin = !isTechnician

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [equipmentFilter, setEquipmentFilter] = useState<{ id: string; name: string } | null>(null)
  const [equipmentPickerVisible, setEquipmentPickerVisible] = useState(false)
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState<JobAid[]>([])
  const [duplicateTarget, setDuplicateTarget] = useState<JobAid | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { mutate: deleteJobAid } = useDeleteJobAid()
  const { mutate: duplicateJobAid, isPending: isDuplicating } = useDuplicateJobAid()
  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment(
    equipmentSearch ? { search: equipmentSearch } : undefined,
  )
  const equipmentItems = (equipmentData?.data ?? []).map((e) => ({ label: e.name, value: e.id }))

  const queryParams = {
    page,
    limit: LIMIT,
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    equipment_id: equipmentFilter?.id,
  }

  const { data, isLoading, refetch, isFetching } = useJobAids(queryParams)

  useEffect(() => {
    if (data?.data) {
      setAllItems((prev) => (page === 1 ? data.data : [...prev, ...data.data]))
    }
  }, [data, page])

  function handleSearch(text: string) {
    setSearch(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text)
      setPage(1)
      setAllItems([])
    }, 300)
  }

  function handleStatusFilter(s: StatusFilter) {
    setStatusFilter(s)
    setPage(1)
    setAllItems([])
  }

  function handleEquipmentFilter(equipment: { id: string; name: string } | null) {
    setEquipmentFilter(equipment)
    setPage(1)
    setAllItems([])
  }

  function handleLongPress(item: JobAid, actions: ReturnType<typeof useJobAidApprovalActions>) {
    const workflowOptions: { text: string; onPress: () => void }[] = []
    if (actions.canSubmitForApproval) {
      workflowOptions.push({ text: 'Submit for Approval', onPress: () => actions.submitForApproval() })
    }
    if (actions.canApprove) {
      workflowOptions.push({
        text: 'Approve',
        onPress: () =>
          Alert.alert(
            'Approve this job aid?',
            `This publishes the job aid and notifies ${item.creator?.first_name ?? 'the creator'}.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Approve', onPress: () => actions.approve() },
            ],
          ),
      })
    }
    if (actions.canUnpublish) {
      workflowOptions.push({
        text: 'Unpublish',
        onPress: () =>
          Alert.alert(
            'Revert to draft?',
            'It will no longer be visible to technicians and will need to go through approval again before it can be published.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Unpublish', style: 'destructive', onPress: () => actions.unpublish() },
            ],
          ),
      })
    }

    Alert.alert(item.title, undefined, [
      ...workflowOptions,
      {
        text: 'Edit',
        onPress: () =>
          router.push({ pathname: '/(app)/(job-aids)/edit', params: { id: item.id } }),
      },
      {
        text: 'Duplicate',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Alert.prompt(
              'Duplicate Job Aid',
              'Enter a title for the new copy',
              (newTitle) => {
                if (newTitle?.trim()) {
                  duplicateJobAid({ id: item.id, title: newTitle.trim() })
                }
              },
              'plain-text',
              `Copy of ${item.title}`,
            )
          } else {
            setDuplicateTarget(item)
          }
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Job Aid', `Delete "${item.title}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteJobAid(item.id),
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const hasMore = data ? page < data.pagination.pages : false

  const STATUS_TABS: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending Approval', value: 'pending_approval' },
    { label: 'Published', value: 'published' },
  ]

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xl font-bold text-gray-900">Job Aids</Text>
          {isAdmin && (
            <Pressable
              onPress={() => router.push('/(app)/(job-aids)/create')}
              className="w-9 h-9 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-10 gap-x-2 mb-3">
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder="Search job aids…"
            className="flex-1 text-sm text-gray-800"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => handleSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Status chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {STATUS_TABS.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => handleStatusFilter(s.value)}
              className={`px-4 py-1.5 rounded-full border ${
                statusFilter === s.value
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  statusFilter === s.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setEquipmentSearch('')
              setEquipmentPickerVisible(true)
            }}
            className={`flex-row items-center gap-x-1 px-4 py-1.5 rounded-full border ${
              equipmentFilter ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${equipmentFilter ? 'text-white' : 'text-gray-600'}`}
              numberOfLines={1}
            >
              {equipmentFilter ? equipmentFilter.name : 'Equipment'}
            </Text>
            {equipmentFilter && (
              <Pressable onPress={() => handleEquipmentFilter(null)} hitSlop={6}>
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </Pressable>
            )}
          </Pressable>
        </ScrollView>
      </View>

      <BottomSheetPicker
        visible={equipmentPickerVisible}
        onClose={() => setEquipmentPickerVisible(false)}
        title="Filter by Equipment"
        items={equipmentItems}
        selected={equipmentFilter?.id ?? null}
        searchable
        loading={equipmentLoading}
        onSelect={(id) => {
          const found = equipmentItems.find((e) => e.value === id)
          handleEquipmentFilter(found ? { id, name: found.label } : null)
          setEquipmentPickerVisible(false)
        }}
      />

      {/* List */}
      <FlatList
        data={page === 1 ? (data?.data ?? allItems) : allItems}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
          flexGrow: 1,
        }}
        onRefresh={() => {
          setPage(1)
          refetch()
        }}
        refreshing={isFetching && page === 1}
        onEndReached={() => {
          if (hasMore && !isFetching) setPage((p) => p + 1)
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          isFetching ? (
            <View className="flex-1 items-center justify-center py-24">
              <ActivityIndicator color="#208AEF" />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-y-3 py-24">
              <Ionicons name="clipboard-outline" size={48} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No job aids found</Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator color="#208AEF" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <JobAidCard
            item={item}
            isAdmin={isAdmin}
            onLongPress={(actions) => handleLongPress(item, actions)}
          />
        )}
      />

      {/* Android duplicate modal */}
      <DuplicateModal
        visible={duplicateTarget !== null}
        originalTitle={duplicateTarget?.title ?? ''}
        isLoading={isDuplicating}
        onCancel={() => setDuplicateTarget(null)}
        onConfirm={(title) => {
          if (duplicateTarget) {
            duplicateJobAid(
              { id: duplicateTarget.id, title },
              { onSuccess: () => setDuplicateTarget(null) },
            )
          }
        }}
      />
    </View>
  )
}
