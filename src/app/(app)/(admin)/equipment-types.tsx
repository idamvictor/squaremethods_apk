import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  useDeleteEquipmentTypeDefault,
  useEquipmentTypeDefaults,
  useSyncEquipmentTypeDefaults,
} from '@/services/admin/admin-queries'
import type { EquipmentTypeDefault } from '@/services/admin/admin-types'

export default function EquipmentTypesScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<EquipmentTypeDefault[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { mutate: deleteType } = useDeleteEquipmentTypeDefault()
  const { mutate: sync, isPending: syncing } = useSyncEquipmentTypeDefaults()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setItems([])
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const { data, isFetching } = useEquipmentTypeDefaults({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
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

  function handleSync() {
    Alert.alert(
      'Sync Equipment Types',
      'This will add default equipment types to all companies that are missing them. Existing types will not be modified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: () =>
            sync(
              {},
              {
                onSuccess: (res) => {
                  const d = res?.data
                  Alert.alert(
                    'Sync Complete',
                    d
                      ? `Processed ${d.companiesProcessed} companies, added ${d.totalAdded} types.`
                      : 'Sync completed.',
                  )
                },
              },
            ),
        },
      ],
    )
  }

  function handleKebab(item: EquipmentTypeDefault) {
    Alert.alert('Equipment Type', item.name, [
      {
        text: 'Edit',
        onPress: () =>
          router.push({
            pathname: '/(app)/(admin)/edit-equipment-type',
            params: {
              id: item.id,
              name: item.name,
              description: item.description ?? '',
              is_active: String(item.is_active),
            },
          }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Equipment Type', `Delete "${item.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteType(item.id),
            },
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
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-gray-900">Equipment Types</Text>
        <Pressable
          onPress={() => router.push('/(app)/(admin)/edit-equipment-type')}
          className="px-3 h-8 rounded-lg bg-blue-600 items-center justify-center active:opacity-80"
        >
          <Text className="text-xs font-semibold text-white">+ Add</Text>
        </Pressable>
      </View>

      {/* Search + Sync */}
      <View className="px-4 pt-3 pb-2 bg-white border-b border-gray-100 flex-row items-center gap-x-2">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl h-9 px-3 gap-x-2">
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search types..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-sm text-gray-800"
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')} hitSlop={4}>
              <Ionicons name="close-circle" size={15} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={handleSync}
          disabled={syncing}
          className="px-3 h-9 rounded-xl border border-gray-200 bg-white items-center justify-center active:opacity-70"
        >
          <Text className="text-xs font-medium text-gray-600">{syncing ? 'Syncing…' : 'Sync'}</Text>
        </Pressable>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 32 }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl px-4 py-3.5 flex-row items-center gap-x-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5 font-mono">{item.slug}</Text>
            </View>
            <View
              className={`px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              <Text
                className={`text-xs font-medium ${item.is_active ? 'text-green-700' : 'text-gray-500'}`}
              >
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Pressable onPress={() => handleKebab(item)} hitSlop={8} className="active:opacity-60">
              <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          isFetching ? <ActivityIndicator color="#208AEF" style={{ marginTop: 12 }} /> : null
        }
        ListEmptyComponent={
          !isFetching ? (
            <View className="items-center py-16 gap-y-3">
              <Ionicons name="cube-outline" size={40} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No equipment types</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}
