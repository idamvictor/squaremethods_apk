import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
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
import { useUsers } from '@/services/users/users-queries'
import { useAuthStore } from '@/store/auth-store'
import type { CompanyUser } from '@/services/users/users-types'

const ROLE_FILTERS = ['all', 'admin', 'editor', 'viewer', 'technician'] as const
type RoleFilter = (typeof ROLE_FILTERS)[number]

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

function RoleBadge({ role }: { role: string }) {
  return (
    <View className="bg-blue-50 rounded-full px-2 py-0.5">
      <Text className="text-xs text-blue-700 capitalize">{role}</Text>
    </View>
  )
}

function UserCard({ item, onPress }: { item: CompanyUser; onPress: () => void }) {
  const initials = getInitials(item.first_name, item.last_name)
  const isActive = item.is_active !== false && item.status !== 'inactive'

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-4 flex-row items-center gap-x-3 active:opacity-80"
    >
      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
        <Text className="text-sm font-bold text-blue-700">{initials}</Text>
      </View>
      <View className="flex-1 gap-y-0.5">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {item.first_name} {item.last_name}
        </Text>
        <Text className="text-xs text-gray-400" numberOfLines={1}>
          {item.email}
        </Text>
      </View>
      <View className="items-end gap-y-1.5">
        <RoleBadge role={item.role} />
        {item.status !== undefined && (
          <View
            className={`w-1.5 h-1.5 rounded-full self-end ${isActive ? 'bg-green-400' : 'bg-gray-300'}`}
          />
        )}
      </View>
    </Pressable>
  )
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets()
  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [page, setPage] = useState(1)
  const [allItems, setAllItems] = useState<CompanyUser[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setAllItems([])
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  useEffect(() => {
    setPage(1)
    setAllItems([])
  }, [roleFilter])

  const { data, isFetching } = useUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
  })

  useEffect(() => {
    if (!data?.data) return
    if (page === 1) {
      setAllItems(data.data)
    } else {
      setAllItems((prev) => [...prev, ...data.data])
    }
  }, [data, page])

  function handleEndReached() {
    if (!data || !isFetching) {
      const totalPages = data?.meta?.totalPages ?? 1
      if (page < totalPages) setPage((p) => p + 1)
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-100 px-4 pb-3">
        {/* Title + invite button */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-x-3">
            <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </Pressable>
            <Text className="text-lg font-bold text-gray-900">Users</Text>
          </View>
          {isAdmin && (
            <Pressable
              onPress={() => router.push('/(app)/(users)/invite')}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center active:opacity-70"
            >
              <Ionicons name="person-add-outline" size={18} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl h-9 px-3 gap-x-2 mb-2">
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search users..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-sm text-gray-800"
            returnKeyType="search"
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')} hitSlop={4}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {ROLE_FILTERS.map((f) => {
            const active = roleFilter === f
            return (
              <Pressable
                key={f}
                onPress={() => setRoleFilter(f)}
                className={`rounded-full px-4 py-1.5 ${active ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}
              >
                <Text className={`text-xs font-medium capitalize ${active ? 'text-white' : 'text-gray-600'}`}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <FlatList
        data={allItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => (
          <UserCard
            item={item}
            onPress={() => router.push({ pathname: '/(app)/(users)/[id]', params: { id: item.id } })}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
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
