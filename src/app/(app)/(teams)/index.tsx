import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useAuthStore } from '@/store/auth-store'
import { useTeams, useDeleteTeam } from '@/services/teams/teams-queries'
import type { Team } from '@/services/teams/teams-types'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin', 'user', 'viewer']

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function TeamCard({
  team,
  onPress,
  onLongPress,
}: {
  team: Team & { memberCount?: number }
  onPress: () => void
  onLongPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="bg-white rounded-2xl p-4 shadow-sm active:opacity-80"
    >
      <View className="flex-row items-center gap-x-3">
        <View className="w-11 h-11 rounded-xl bg-blue-100 items-center justify-center">
          <Text className="text-sm font-bold text-blue-600">{getInitials(team.name)}</Text>
        </View>
        <View className="flex-1 gap-y-0.5">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            {team.name}
          </Text>
          {!!team.description && (
            <Text className="text-xs text-gray-400" numberOfLines={2}>
              {team.description}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>
    </Pressable>
  )
}

export default function TeamsScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [search])

  const { data, isLoading, isFetching, refetch } = useTeams(
    debouncedSearch ? { search: debouncedSearch } : undefined,
  )
  const { mutate: deleteTeam } = useDeleteTeam()

  const teams = data?.data ?? []

  const handleRefresh = useCallback(() => { refetch() }, [refetch])

  function handleLongPress(team: Team) {
    if (!isAdmin) return
    Alert.alert(team.name, undefined, [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/(app)/(teams)/edit', params: { id: team.id } }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Team', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteTeam(team.id) },
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
          <Text className="text-xl font-bold text-gray-900">Teams</Text>
          {isAdmin && (
            <Pressable
              onPress={() => router.push('/(app)/(teams)/create')}
              className="w-8 h-8 items-center justify-center rounded-full bg-blue-600 active:opacity-70"
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-9 mt-3 gap-x-2">
          <Ionicons name="search-outline" size={15} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search teams…"
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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#208AEF" />
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          onRefresh={handleRefresh}
          refreshing={isFetching}
          renderItem={({ item }) => (
            <TeamCard
              team={item}
              onPress={() => router.push({ pathname: '/(app)/(teams)/[id]', params: { id: item.id } })}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24">
              <Ionicons name="people-outline" size={40} color="#D1D5DB" />
              <Text className="mt-3 text-sm text-gray-400">No teams found</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
