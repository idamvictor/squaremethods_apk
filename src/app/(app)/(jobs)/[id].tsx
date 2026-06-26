import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import {
  useJobById,
  useStartJob,
  useCompleteJob,
  useUpdateTaskStatus,
  useDeleteJob,
} from '@/services/jobs/jobs-queries'
import type { JobStatus, Task } from '@/services/jobs/jobs-types'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin', 'user', 'viewer']

const STATUS_STYLE: Record<JobStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  on_hold: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'On Hold' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-600', label: 'Cancelled' },
}

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  urgent: { bg: 'bg-red-100', text: 'text-red-600' },
  high: { bg: 'bg-orange-100', text: 'text-orange-600' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low: { bg: 'bg-green-100', text: 'text-green-700' },
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(dateStr: string, status: JobStatus) {
  if (status === 'completed' || status === 'cancelled') return false
  return new Date(dateStr) < new Date()
}

function InfoRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: string }) {
  return (
    <View className="gap-y-0.5">
      <Text className="text-xs text-gray-400 font-medium">{label}</Text>
      <Text className={`text-sm text-gray-800 font-medium ${valueStyle ?? ''}`} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

function TaskRow({ task, jobId, isPendingUpdate }: { task: Task; jobId: string; isPendingUpdate: boolean }) {
  const { mutate: updateTask } = useUpdateTaskStatus()
  const isCompleted = task.status === 'completed'

  function toggle() {
    if (isPendingUpdate) return
    updateTask({
      jobId,
      taskId: task.id,
      status: isCompleted ? 'pending' : 'completed',
      notes: '',
    })
  }

  return (
    <Pressable
      onPress={toggle}
      disabled={isPendingUpdate}
      className="flex-row items-center px-4 py-3.5 gap-x-3 active:bg-gray-50"
    >
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
        }`}
      >
        {isCompleted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}
          numberOfLines={2}
        >
          {task.step_number}. {task.title}
        </Text>
      </View>
    </Pressable>
  )
}

export default function JobDetailScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const user = useAuthStore((s) => s.user)
  const isAdmin = ADMIN_ROLES.includes((user?.role ?? '') as UserRole)

  const { data: job, isLoading, error } = useJobById(id)
  const { mutate: startJob, isPending: isStarting } = useStartJob()
  const { mutate: completeJob, isPending: isCompleting } = useCompleteJob()
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob()
  const { isPending: isUpdatingTask } = useUpdateTaskStatus()

  const [showCompleteInput, setShowCompleteInput] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')

  const canAct = isAdmin || user?.id === job?.assigned_to

  function handleStart() {
    if (!id) return
    Alert.alert('Start Job', 'Mark this job as in progress?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: () => startJob(id),
      },
    ])
  }

  function handleComplete() {
    if (!id) return
    completeJob(
      { jobId: id, completionNotes },
      { onSuccess: () => { setShowCompleteInput(false); setCompletionNotes('') } },
    )
  }

  function handleDelete() {
    if (!id) return
    Alert.alert('Delete Job', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteJob(id, { onSuccess: () => router.back() }),
      },
    ])
  }

  function handleKebab() {
    Alert.alert('Job Actions', undefined, [
      { text: 'Edit', onPress: () => router.push({ pathname: '/(app)/(jobs)/edit', params: { id } }) },
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

  if (error || !job) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center gap-y-3" style={{ paddingTop: insets.top }}>
        <Text className="text-sm text-gray-400">Failed to load job</Text>
        <Pressable onPress={() => router.back()} className="px-4 py-2 bg-blue-600 rounded-xl">
          <Text className="text-sm text-white font-medium">Go back</Text>
        </Pressable>
      </View>
    )
  }

  const statusStyle = STATUS_STYLE[job.status] ?? STATUS_STYLE.pending
  const priorityStyle = PRIORITY_STYLE[job.priority] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
  const overdue = isOverdue(job.due_date, job.status)
  const completedTasks = job.tasks?.filter((t) => t.status === 'completed').length ?? 0
  const totalTasks = job.tasks?.length ?? 0

  const showStartButton = canAct && job.status === 'pending'
  const showCompleteButton = canAct && job.status === 'in_progress'
  const hasAction = showStartButton || showCompleteButton

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
          {job.title}
        </Text>
        {isAdmin && (
          <Pressable onPress={handleKebab} hitSlop={8} className="active:opacity-60">
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + (hasAction ? 88 : 24) }}
      >
        {/* Status + Priority badges */}
        <View className="flex-row gap-x-2 flex-wrap">
          <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>{statusStyle.label}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${priorityStyle.bg}`}>
            <Text className={`text-xs font-semibold ${priorityStyle.text} capitalize`}>{job.priority}</Text>
          </View>
        </View>

        {/* Info grid */}
        <View className="bg-white rounded-2xl p-4 gap-y-4">
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow
                label="Assigned To"
                value={`${job.assignedUser?.first_name ?? ''} ${job.assignedUser?.last_name ?? ''}`.trim() || '—'}
              />
            </View>
            <View className="flex-1">
              <InfoRow label="Team" value={job.team?.name ?? '—'} />
            </View>
          </View>
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow label="Equipment" value={job.equipment?.name ?? '—'} />
            </View>
            <View className="flex-1">
              <InfoRow
                label="Due Date"
                value={formatDate(job.due_date)}
                valueStyle={overdue ? 'text-red-500' : ''}
              />
            </View>
          </View>
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <InfoRow label="Est. Duration" value={job.estimated_duration ? `${job.estimated_duration}h` : '—'} />
            </View>
            <View className="flex-1">
              <InfoRow label="Actual Duration" value={job.actual_duration ? `${job.actual_duration}h` : '—'} />
            </View>
          </View>
        </View>

        {/* Description */}
        {!!job.description && (
          <View className="bg-white rounded-2xl p-4 gap-y-1">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</Text>
            <Text className="text-sm text-gray-700 leading-5">{job.description}</Text>
          </View>
        )}

        {/* Safety Notes */}
        {!!job.safety_notes && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 gap-y-1">
            <View className="flex-row items-center gap-x-1.5">
              <Ionicons name="warning-outline" size={15} color="#D97706" />
              <Text className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Safety Notes</Text>
            </View>
            <Text className="text-sm text-amber-800 leading-5">{job.safety_notes}</Text>
          </View>
        )}

        {/* Tasks */}
        {totalTasks > 0 && (
          <View className="bg-white rounded-2xl overflow-hidden">
            <View className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">Tasks</Text>
              <Text className="text-xs text-gray-400">{completedTasks}/{totalTasks} completed</Text>
            </View>
            {job.tasks.map((task, index) => (
              <View key={task.id}>
                <TaskRow task={task} jobId={id ?? ''} isPendingUpdate={isUpdatingTask} />
                {index < job.tasks.length - 1 && (
                  <View className="h-px bg-gray-100 ml-12" />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Completion Notes */}
        {job.status === 'completed' && !!job.completion_notes && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 gap-y-1">
            <Text className="text-xs font-semibold text-green-700 uppercase tracking-wide">Completion Notes</Text>
            <Text className="text-sm text-green-800 leading-5">{job.completion_notes}</Text>
          </View>
        )}

        {/* Complete Job inline input */}
        {showCompleteInput && (
          <View className="bg-white rounded-2xl p-4 gap-y-3">
            <Text className="text-sm font-semibold text-gray-900">Completion Notes</Text>
            <TextInput
              value={completionNotes}
              onChangeText={setCompletionNotes}
              placeholder="Describe what was done…"
              multiline
              numberOfLines={4}
              className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 min-h-[80px]"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
            <View className="flex-row gap-x-2">
              <Pressable
                onPress={() => setShowCompleteInput(false)}
                className="flex-1 h-10 rounded-xl border border-gray-200 items-center justify-center active:opacity-70"
              >
                <Text className="text-sm font-medium text-gray-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleComplete}
                disabled={isCompleting}
                className="flex-1 h-10 rounded-xl bg-green-600 items-center justify-center active:opacity-70"
              >
                <Text className="text-sm font-semibold text-white">
                  {isCompleting ? 'Saving…' : 'Confirm'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky action bar */}
      {hasAction && !showCompleteInput && (
        <View
          style={{ paddingBottom: insets.bottom + 8 }}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3"
        >
          {showStartButton && (
            <Pressable
              onPress={handleStart}
              disabled={isStarting}
              className="h-12 rounded-2xl bg-blue-600 items-center justify-center active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">
                {isStarting ? 'Starting…' : 'Start Job'}
              </Text>
            </Pressable>
          )}
          {showCompleteButton && (
            <Pressable
              onPress={() => setShowCompleteInput(true)}
              className="h-12 rounded-2xl bg-green-600 items-center justify-center active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">Complete Job</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}
