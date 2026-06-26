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
  useAdminUsers,
  useDeleteAdminUser,
  useHardDeleteAdminUser,
  useRestoreAdminUser,
} from '@/services/admin/admin-queries'
import type { AdminUser, AdminUserRole } from '@/services/admin/admin-types'

type RoleFilter = 'all' | AdminUserRole

const ROLE_FILTERS: RoleFilter[] = ['all', 'owner', 'admin', 'viewer', 'technician', 'superadmin']

const ROLE_STYLE: Record<AdminUserRole, { bg: string; text: string }> = {
  superadmin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  owner: { bg: 'bg-blue-100', text: 'text-blue-700' },
  admin: { bg: 'bg-orange-100', text: 'text-orange-700' },
  editor: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  viewer: { bg: 'bg-gray-100', text: 'text-gray-600' },
  technician: { bg: 'bg-green-100', text: 'text-green-700' },
}

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<AdminUser[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { mutate: softDelete } = useDeleteAdminUser()
  const { mutate: hardDelete } = useHardDeleteAdminUser()
  const { mutate: restore } = useRestoreAdminUser()

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
  }, [roleFilter, showDeleted])

  const { data, isFetching } = useAdminUsers({
    page,
    limit: 15,
    search: debouncedSearch || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
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

  function handleKebab(item: AdminUser) {
    const name = `${item.first_name} ${item.last_name}`
    if (item.deleted_at) {
      Alert.alert('User Actions', name, [
        {
          text: 'Restore',
          onPress: () => restore(item.id),
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Delete Forever', `Permanently delete "${name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => hardDelete({ id: item.id }),
              },
            ]),
        },
        { text: 'Cancel', style: 'cancel' },
      ])
    } else {
      Alert.alert('User Actions', name, [
        {
          text: 'Edit',
          onPress: () =>
            router.push({
              pathname: '/(app)/(admin)/edit-user',
              params: {
                id: item.id,
                first_name: item.first_name,
                last_name: item.last_name,
                email: item.email,
                phone: item.phone ?? '',
                is_active: String(item.is_active),
                email_verified: String(item.email_verified),
              },
            }),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Delete User', `Move "${name}" to trash?`, [
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
        <Text className="flex-1 text-lg font-bold text-gray-900">Users</Text>
      </View>

      {/* Search */}
      <View className="px-4 pt-3 pb-2 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl h-9 px-3 gap-x-2">
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search users..."
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

      {/* Role filters */}
      <View className="bg-white border-b border-gray-100 px-4 py-2 flex-row items-center gap-x-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          className="flex-1"
        >
          {ROLE_FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setRoleFilter(f)}
              className={`px-3 py-1 rounded-full ${
                roleFilter === f ? 'bg-blue-600' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-medium capitalize ${
                  roleFilter === f ? 'text-white' : 'text-gray-600'
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
          const rs = ROLE_STYLE[item.role] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
          const initials = getInitials(item.first_name, item.last_name)
          return (
            <View className="bg-white rounded-2xl p-4 flex-row items-center gap-x-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-sm font-bold text-blue-700">{initials}</Text>
              </View>
              <View className="flex-1 gap-y-0.5">
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                    {item.first_name} {item.last_name}
                  </Text>
                  {item.deleted_at && (
                    <View className="bg-red-100 rounded-full px-1.5 py-0.5">
                      <Text className="text-xs text-red-600">Deleted</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-gray-400" numberOfLines={1}>
                  {item.email}
                </Text>
                <Text className="text-xs text-gray-400" numberOfLines={1}>
                  {item.company?.name}
                </Text>
              </View>
              <View className="items-end gap-y-1.5">
                <View className={`px-2 py-0.5 rounded-full ${rs.bg}`}>
                  <Text className={`text-xs font-medium capitalize ${rs.text}`}>{item.role}</Text>
                </View>
                <View
                  className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-gray-300'}`}
                />
              </View>
              <Pressable
                onPress={() => handleKebab(item)}
                hitSlop={8}
                className="active:opacity-60 ml-1"
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
              </Pressable>
            </View>
          )
        }}
        ListFooterComponent={
          isFetching ? <ActivityIndicator color="#208AEF" style={{ marginTop: 12 }} /> : null
        }
        ListEmptyComponent={
          !isFetching ? (
            <View className="items-center py-16 gap-y-3">
              <Ionicons name="people-outline" size={40} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No users found</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}
