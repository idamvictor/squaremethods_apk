import {
  ActivityIndicator,
  Alert,
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
  useFailureModeById,
  useUpdateFailureMode,
  useDeleteFailureMode,
} from '@/services/failure-mode/failure-mode-queries'
import type { FailureModeStatus } from '@/services/failure-mode/failure-mode-types'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin', 'user', 'viewer']

const STATUS_STYLE: Record<FailureModeStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
}

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-orange-100', text: 'text-orange-600' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low: { bg: 'bg-green-100', text: 'text-green-700' },
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-y-0.5">
      <Text className="text-xs text-gray-400 font-medium">{label}</Text>
      <Text className="text-sm text-gray-800 font-medium" numberOfLines={1}>{value}</Text>
    </View>
  )
}

export default function FailureModeDetailScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const user = useAuthStore((s) => s.user)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const { data: fm, isLoading, error } = useFailureModeById(id)
  const { mutate: updateFm, isPending: isUpdating } = useUpdateFailureMode()
  const { mutate: deleteFm, isPending: isDeleting } = useDeleteFailureMode()

  const canAct = isAdmin || user?.id === fm?.reported_by

  function handleStatusTransition() {
    if (!id || !fm) return
    const nextStatus: FailureModeStatus = fm.status === 'open' ? 'in_progress' : 'resolved'
    const label = nextStatus === 'in_progress' ? 'Mark In Progress' : 'Mark Resolved'
    Alert.alert(label, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateFm({ failureModeId: id, status: nextStatus }) },
    ])
  }

  function handleDelete() {
    if (!id) return
    Alert.alert('Delete Failure Mode', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteFm(id, { onSuccess: () => router.back() }),
      },
    ])
  }

  function handleKebab() {
    Alert.alert('Actions', undefined, [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/(app)/(failure-mode)/edit', params: { id } }),
      },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
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

  if (error || !fm) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center gap-y-3" style={{ paddingTop: insets.top }}>
        <Text className="text-sm text-gray-400">Failed to load failure mode</Text>
        <Pressable onPress={() => router.back()} className="px-4 py-2 bg-blue-600 rounded-xl">
          <Text className="text-sm text-white font-medium">Go back</Text>
        </Pressable>
      </View>
    )
  }

  const statusStyle = STATUS_STYLE[fm.status] ?? STATUS_STYLE.open
  const priorityStyle = PRIORITY_STYLE[fm.priority] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
  const showActionBar = canAct && fm.status !== 'resolved'
  const actionLabel = fm.status === 'open' ? 'Mark In Progress' : 'Mark Resolved'
  const actionColor = fm.status === 'open' ? 'bg-blue-600' : 'bg-green-600'

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
          {fm.title}
        </Text>
        {canAct && (
          <Pressable onPress={handleKebab} hitSlop={8} className="active:opacity-60">
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + (showActionBar ? 88 : 24) }}
      >
        {/* Status + Priority badges */}
        <View className="flex-row gap-x-2 flex-wrap">
          <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>{statusStyle.label}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${priorityStyle.bg}`}>
            <Text className={`text-xs font-semibold ${priorityStyle.text} capitalize`}>{fm.priority} Priority</Text>
          </View>
        </View>

        {/* Info grid */}
        <View className="bg-white rounded-2xl p-4 gap-y-4">
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow label="Equipment" value={fm.equipment?.name ?? '—'} />
            </View>
            <View className="flex-1">
              <InfoRow
                label="Reporter"
                value={
                  fm.reporter
                    ? `${fm.reporter.first_name} ${fm.reporter.last_name}`.trim()
                    : '—'
                }
              />
            </View>
          </View>
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow label="Due Date" value={formatDate(fm.due_date)} />
            </View>
            <View className="flex-1">
              <InfoRow label="Ref Code" value={fm.equipment?.reference_code ?? '—'} />
            </View>
          </View>
        </View>

        {/* Resolutions */}
        {fm.resolutions && fm.resolutions.length > 0 && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 gap-y-2">
            <Text className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Resolutions ({fm.resolutions.length})
            </Text>
            {fm.resolutions.map((r, i) => (
              <View key={i} className="flex-row items-start gap-x-2">
                <View className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                <Text className="flex-1 text-sm text-green-800 leading-5">{r}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky action bar */}
      {showActionBar && (
        <View
          style={{ paddingBottom: insets.bottom + 8 }}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3"
        >
          <Pressable
            onPress={handleStatusTransition}
            disabled={isUpdating}
            className={`h-12 rounded-2xl ${actionColor} items-center justify-center active:opacity-80`}
          >
            <Text className="text-sm font-semibold text-white">
              {isUpdating ? 'Updating…' : actionLabel}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
