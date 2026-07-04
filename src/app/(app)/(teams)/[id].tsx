import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import {
  useTeamById,
  useAddTeamMember,
  useRemoveTeamMember,
  useDeleteTeam,
} from '@/services/teams/teams-queries'
import { useCompanyUsers } from '@/services/users/users-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import type { TeamMember } from '@/services/teams/teams-types'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin', 'user', 'viewer']

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
  manager: { bg: 'bg-purple-100', text: 'text-purple-700' },
  member: { bg: 'bg-blue-100', text: 'text-blue-700' },
  admin: { bg: 'bg-red-100', text: 'text-red-600' },
  owner: { bg: 'bg-amber-100', text: 'text-amber-700' },
  technician: { bg: 'bg-green-100', text: 'text-green-700' },
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

function MemberRow({
  member,
  isAdmin,
  onRemove,
}: {
  member: TeamMember
  isAdmin: boolean
  onRemove: () => void
}) {
  const roleStyle = ROLE_STYLE[member.role] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }

  return (
    <Pressable
      onLongPress={isAdmin ? onRemove : undefined}
      className="flex-row items-center px-4 py-3.5 gap-x-3 active:bg-gray-50"
    >
      <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center">
        <Text className="text-xs font-bold text-blue-600">
          {getInitials(member.first_name, member.last_name)}
        </Text>
      </View>
      <View className="flex-1 gap-y-0.5">
        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
          {member.first_name} {member.last_name}
        </Text>
        <Text className="text-xs text-gray-400" numberOfLines={1}>{member.email}</Text>
      </View>
      <View className={`px-2 py-0.5 rounded-full ${roleStyle.bg}`}>
        <Text className={`text-xs font-medium capitalize ${roleStyle.text}`}>{member.role}</Text>
      </View>
      {isAdmin && (
        <Pressable onPress={onRemove} hitSlop={8} className="active:opacity-60 ml-1">
          <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
        </Pressable>
      )}
    </Pressable>
  )
}

export default function TeamDetailScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const user = useAuthStore((s) => s.user)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const { data: team, isLoading, error } = useTeamById(id)
  const { mutate: addMember, isPending: isAdding } = useAddTeamMember()
  const { mutate: removeMember } = useRemoveTeamMember()
  const { mutate: deleteTeam, isPending: isDeleting } = useDeleteTeam()

  const [showAddMember, setShowAddMember] = useState(false)
  const { data: companyUsers, isLoading: usersLoading } = useCompanyUsers()

  const members = team?.members ?? []
  const memberIds = new Set(members.map((m) => m.id))

  const userPickerItems = (companyUsers?.data ?? [])
    .filter((u) => !memberIds.has(u.id))
    .map((u) => ({ label: `${u.first_name} ${u.last_name}`, value: u.id }))

  function handleRemoveMember(member: TeamMember) {
    Alert.alert(
      'Remove Member',
      `Remove ${member.first_name} ${member.last_name} from this team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember({ teamId: id ?? '', userId: member.id }),
        },
      ],
    )
  }

  function handleKebab() {
    Alert.alert('Team Actions', undefined, [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/(app)/(teams)/edit', params: { id } }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete Team', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteTeam(id ?? '', { onSuccess: () => router.back() }),
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

  if (error || !team) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center gap-y-3" style={{ paddingTop: insets.top }}>
        <Text className="text-sm text-gray-400">Failed to load team</Text>
        <Pressable onPress={() => router.back()} className="px-4 py-2 bg-blue-600 rounded-xl">
          <Text className="text-sm text-white font-medium">Go back</Text>
        </Pressable>
      </View>
    )
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
        <Text className="flex-1 text-base font-bold text-gray-900" numberOfLines={1}>
          {team.name}
        </Text>
        {isAdmin && (
          <Pressable onPress={handleKebab} hitSlop={8} className="active:opacity-60">
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}>
        {/* Description */}
        {!!team.description && (
          <View className="bg-white rounded-2xl p-4 gap-y-1">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">About</Text>
            <Text className="text-sm text-gray-700 leading-5">{team.description}</Text>
          </View>
        )}

        {/* Members section */}
        <View className="bg-white rounded-2xl overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-gray-900">
              Members ({members.length})
            </Text>
            {isAdmin && (
              <Pressable
                onPress={() => setShowAddMember(true)}
                className="flex-row items-center gap-x-1 active:opacity-70"
              >
                <Ionicons name="person-add-outline" size={15} color="#208AEF" />
                <Text className="text-xs font-medium text-blue-600">Add Member</Text>
              </Pressable>
            )}
          </View>

          {members.length === 0 ? (
            <View className="py-8 items-center gap-y-2">
              <Ionicons name="people-outline" size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No members yet</Text>
            </View>
          ) : (
            members.map((member, index) => (
              <View key={member.id}>
                <MemberRow
                  member={member}
                  isAdmin={isAdmin}
                  onRemove={() => handleRemoveMember(member)}
                />
                {index < members.length - 1 && <View className="h-px bg-gray-100 ml-16" />}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Member bottom sheet */}
      <BottomSheetPicker
        visible={showAddMember}
        onClose={() => setShowAddMember(false)}
        title="Add Member"
        items={userPickerItems}
        selected=""
        searchable
        loading={usersLoading || isAdding}
        onSelect={(userId) => {
          if (!id || !userId) return
          addMember({ teamId: id, user_id: userId, role: 'member' })
        }}
      />
    </View>
  )
}
