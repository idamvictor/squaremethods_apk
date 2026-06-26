import { useEffect, useRef, useState } from 'react'
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
import {
  useAdminCompanies,
  useDeleteAdminCompany,
  useHardDeleteAdminCompany,
  useRestoreAdminCompany,
} from '@/services/admin/admin-queries'
import type { AdminCompany, AdminCompanyStatus } from '@/services/admin/admin-types'

type StatusFilter = 'all' | AdminCompanyStatus

const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'inactive', 'suspended']

const STATUS_STYLE: Record<AdminCompanyStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-500' },
  suspended: { bg: 'bg-red-100', text: 'text-red-600' },
}

export default function CompaniesScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<AdminCompany[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { mutate: softDelete } = useDeleteAdminCompany()
  const { mutate: hardDelete } = useHardDeleteAdminCompany()
  const { mutate: restore } = useRestoreAdminCompany()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setItems([])
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  useEffect(() => {
    setPage(1)
    setItems([])
  }, [statusFilter, showDeleted])

  const { data, isFetching } = useAdminCompanies({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    deleted: showDeleted ? 'true' : undefined,
  })

  useEffect(() => {
    if (!data?.data) return
    if (page === 1) setItems(data.data)
    else setItems((prev) => [...prev, ...data.data])
  }, [data, page])

  function handleEndReached() {
    if (isFetching) return
    const totalPages = data?.pagination?.pages ?? 1
    if (page < totalPages) setPage((p) => p + 1)
  }

  function handleKebab(item: AdminCompany) {
    if (item.deleted_at) {
      Alert.alert('Company Actions', item.name, [
        {
          text: 'Restore',
          onPress: () => restore(item.id),
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Delete Forever',
              `Permanently delete "${item.name}"? This cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => hardDelete({ id: item.id }),
                },
              ],
            ),
        },
        { text: 'Cancel', style: 'cancel' },
      ])
    } else {
      Alert.alert('Company Actions', item.name, [
        {
          text: 'Edit',
          onPress: () =>
            router.push({
              pathname: '/(app)/(admin)/edit-company',
              params: {
                id: item.id,
                name: item.name,
                email: item.email,
                address: item.address ?? '',
                status: item.status,
              },
            }),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Delete Company', `Move "${item.name}" to trash?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => softDelete(item.id),
              },
            ]),
        },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-gray-900">Companies</Text>
      </View>

      {/* Search */}
      <View className="px-4 pt-3 pb-2 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl h-9 px-3 gap-x-2">
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search companies..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-sm text-gray-800"
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')} hitSlop={4}>
              <Ionicons name="close-circle" size={15} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters */}
      <View className="bg-white border-b border-gray-100 px-4 py-2 flex-row items-center gap-x-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          className="flex-1"
        >
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-full ${
                statusFilter === f ? 'bg-blue-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-medium capitalize ${
                  statusFilter === f ? 'text-white' : 'text-gray-600'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          onPress={() => setShowDeleted((v) => !v)}
          className={`flex-row items-center gap-x-1 px-3 py-1 rounded-full ${
            showDeleted ? 'bg-red-100' : 'bg-gray-100'
          }`}
        >
          <Ionicons
            name={showDeleted ? 'eye-off' : 'trash-outline'}
            size={13}
            color={showDeleted ? '#DC2626' : '#6B7280'}
          />
          <Text className={`text-xs font-medium ${showDeleted ? 'text-red-600' : 'text-gray-600'}`}>
            Trash
          </Text>
        </Pressable>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 32 }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => {
          const ss = STATUS_STYLE[item.status]
          return (
            <View className="bg-white rounded-2xl p-4 gap-y-2">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 gap-y-0.5">
                  <View className="flex-row items-center gap-x-2">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.deleted_at && (
                      <View className="bg-red-100 rounded-full px-1.5 py-0.5">
                        <Text className="text-xs text-red-600">Deleted</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400">{item.slug}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleKebab(item)}
                  hitSlop={8}
                  className="active:opacity-60 ml-2"
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
              <View className="flex-row items-center justify-between">
                <View className={`self-start px-2 py-0.5 rounded-full ${ss.bg}`}>
                  <Text className={`text-xs font-medium capitalize ${ss.text}`}>{item.status}</Text>
                </View>
                <Text className="text-xs text-gray-400">{item.user_count} users</Text>
              </View>
            </View>
          )
        }}
        ListFooterComponent={
          isFetching ? <ActivityIndicator color="#208AEF" style={{ marginTop: 12 }} /> : null
        }
        ListEmptyComponent={
          !isFetching ? (
            <View className="items-center py-16 gap-y-3">
              <Ionicons name="business-outline" size={40} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No companies found</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}
