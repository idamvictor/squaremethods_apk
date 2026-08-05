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
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTeams, useDeleteTeam, useTeamMembers } from '@/services/teams/teams-queries'
import { usePermissions } from '@/lib/permissions'
import { AccessRestricted } from '@/components/ui/access-restricted'
import type { Team } from '@/services/teams/teams-types'

function TeamAvatarStack({ teamId }: { teamId: string }) {
  const { data, isLoading } = useTeamMembers(teamId)
  const members = data?.data ?? []

  if (isLoading) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#E5E7EB',
              marginLeft: i === 0 ? 0 : -10,
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          />
        ))}
      </View>
    )
  }

  const visible = members.slice(0, 4)
  const overflow = members.length - visible.length

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {members.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {visible.map((m, i) => (
            <View
              key={m.id}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                overflow: 'hidden',
                marginLeft: i === 0 ? 0 : -10,
                borderWidth: 2,
                borderColor: '#FFFFFF',
                backgroundColor: '#E5E7EB',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {m.avatar_url ? (
                <Image
                  source={{ uri: m.avatar_url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#4B5563' }}>
                  {`${m.first_name[0] ?? ''}${m.last_name[0] ?? ''}`.toUpperCase()}
                </Text>
              )}
            </View>
          ))}
          {overflow > 0 && (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                marginLeft: -10,
                borderWidth: 2,
                borderColor: '#FFFFFF',
                backgroundColor: '#DBEAFE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#1D4ED8' }}>
                +{overflow}
              </Text>
            </View>
          )}
        </View>
      ) : null}
      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
        {members.length} member{members.length !== 1 ? 's' : ''}
      </Text>
    </View>
  )
}

function TeamCard({
  team,
  onPress,
  onLongPress,
}: {
  team: Team
  onPress: () => void
  onLongPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="bg-white rounded-2xl p-4 shadow-sm active:opacity-80"
    >
      {/* Name + chevron */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className="flex-1 text-sm font-bold text-gray-900 mr-2" numberOfLines={1}>
          {team.name}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>

      {/* Description */}
      {!!team.description ? (
        <Text className="text-xs text-gray-400 mb-3" numberOfLines={1}>
          {team.description}
        </Text>
      ) : (
        <View className="mb-2" />
      )}

      {/* Stacked avatars + member count */}
      <TeamAvatarStack teamId={team.id} />
    </Pressable>
  )
}

export default function TeamsScreen() {
  const insets = useSafeAreaInsets()
  const { isAdmin, isTechnician } = usePermissions()

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

  if (isTechnician) {
    return <AccessRestricted />
  }

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
