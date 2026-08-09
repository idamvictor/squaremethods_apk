import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import {
  useFailureModeById,
  useDeleteFailureMode,
} from '@/services/failure-mode/failure-mode-queries'
import type { ContributionType, FailureMode, FailureModeStatus } from '@/services/failure-mode/failure-mode-types'
import { useFailureModeApprovalActions } from '@/hooks/use-failure-mode-approval-actions'

const STATUS_STYLE: Record<FailureModeStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Closed' },
}

const CONTRIBUTION_TYPE_STYLE: Record<ContributionType, { bg: string; text: string }> = {
  'Problem Solved': { bg: 'bg-green-100', text: 'text-green-700' },
  Improvement: { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Best Practice': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Lesson Learned': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Troubleshooting Tip': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Safety Observation': { bg: 'bg-red-100', text: 'text-red-700' },
  'PM Optimization': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
}

function ApprovalActionsBar({
  fm,
  insetsBottom,
}: {
  fm: Pick<FailureMode, 'id' | 'status' | 'reported_by'> & { reporter?: FailureMode['reporter'] }
  insetsBottom: number
}) {
  const { canApprove, isPendingOwnApproval, canReopen, approve, reopen, isSaving } =
    useFailureModeApprovalActions(fm)

  function handleApprove() {
    Alert.alert(
      'Approve this contribution?',
      `This notifies ${fm.reporter?.first_name ?? 'the reporter'} that it's been approved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => approve() },
      ],
    )
  }

  function handleReopen() {
    Alert.alert(
      'Reopen this contribution?',
      'It will need to be approved again, and clears the current approval.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reopen', style: 'destructive', onPress: () => reopen() },
      ],
    )
  }

  if (!canApprove && !isPendingOwnApproval && !canReopen) return null

  return (
    <View
      style={{ paddingBottom: insetsBottom + 8 }}
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 gap-y-2"
    >
      {canApprove && (
        <Pressable
          onPress={handleApprove}
          disabled={isSaving}
          className="h-12 rounded-2xl bg-blue-600 items-center justify-center active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">
            {isSaving ? 'Saving…' : 'Approve'}
          </Text>
        </Pressable>
      )}
      {isPendingOwnApproval && (
        <Text className="text-xs text-gray-400 italic text-center py-3">
          Awaiting approval from another reviewer
        </Text>
      )}
      {canReopen && (
        <Pressable
          onPress={handleReopen}
          disabled={isSaving}
          className="h-12 rounded-2xl border border-gray-200 items-center justify-center active:opacity-70"
        >
          <Text className="text-sm font-semibold text-gray-700">
            {isSaving ? 'Saving…' : 'Reopen'}
          </Text>
        </Pressable>
      )}
    </View>
  )
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

  const { data: fm, isLoading, error } = useFailureModeById(id)
  const { mutate: deleteFm, isPending: isDeleting } = useDeleteFailureMode()
  const [imageViewerVisible, setImageViewerVisible] = useState(false)

  function handleDelete() {
    if (!id) return
    Alert.alert('Delete Contribution', 'This action cannot be undone.', [
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
        onPress: () => router.push({ pathname: '/(app)/(contributions)/edit', params: { id } }),
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
        <Text className="text-sm text-gray-400">Failed to load contribution</Text>
        <Pressable onPress={() => router.back()} className="px-4 py-2 bg-blue-600 rounded-xl">
          <Text className="text-sm text-white font-medium">Go back</Text>
        </Pressable>
      </View>
    )
  }

  const statusStyle = STATUS_STYLE[fm.status] ?? STATUS_STYLE.open
  const contributionTypeStyle = CONTRIBUTION_TYPE_STYLE[fm.priority] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }

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
        <Pressable onPress={handleKebab} hitSlop={8} className="active:opacity-60">
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 96 }}
      >
        {/* Hero image card */}
        <Pressable
          onPress={() => fm.image && setImageViewerVisible(true)}
          className="w-full bg-gray-200 rounded-2xl overflow-hidden"
          style={{ aspectRatio: 16 / 9 }}
        >
          {fm.image ? (
            <Image
              source={{ uri: fm.image }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="warning-outline" size={48} color="#9CA3AF" />
            </View>
          )}
        </Pressable>

        {/* Status + Contribution Type badges */}
        <View className="flex-row gap-x-2 flex-wrap">
          <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>{statusStyle.label}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${contributionTypeStyle.bg}`}>
            <Text className={`text-xs font-semibold ${contributionTypeStyle.text}`}>{fm.priority}</Text>
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
                label="Contributed By"
                value={
                  fm.reporter
                    ? `${fm.reporter.first_name} ${fm.reporter.last_name}`.trim() +
                      (fm.reporter.role ? ` (${fm.reporter.role})` : '')
                    : '—'
                }
              />
            </View>
          </View>
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow label="Date" value={formatDate(fm.due_date)} />
            </View>
            <View className="flex-1">
              <InfoRow label="Ref Code" value={fm.equipment?.reference_code ?? '—'} />
            </View>
          </View>
        </View>

        {/* Approved By */}
        {fm.approver && (
          <View className="bg-white rounded-2xl p-4 gap-y-1">
            <Text className="text-xs text-gray-400 font-medium">Approved By</Text>
            <Text className="text-sm text-gray-800 font-medium">
              {`${fm.approver.first_name} ${fm.approver.last_name}`.trim()}
            </Text>
          </View>
        )}

        {/* Key Points */}
        {fm.resolutions && fm.resolutions.length > 0 && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 gap-y-2">
            <Text className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Key Points ({fm.resolutions.length})
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

      <ApprovalActionsBar fm={fm} insetsBottom={insets.bottom} />

      {fm.image && (
        <Modal visible={imageViewerVisible} transparent animationType="fade" onRequestClose={() => setImageViewerVisible(false)}>
          <Pressable
            onPress={() => setImageViewerVisible(false)}
            className="flex-1 bg-black/90 items-center justify-center"
          >
            <Image
              source={{ uri: fm.image }}
              style={{ width: '100%', height: '80%' }}
              contentFit="contain"
            />
            <Pressable
              onPress={() => setImageViewerVisible(false)}
              hitSlop={12}
              style={{ position: 'absolute', top: insets.top + 12, right: 20 }}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  )
}
