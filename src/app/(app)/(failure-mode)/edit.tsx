import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useFailureModeById, useUpdateFailureMode } from '@/services/failure-mode/failure-mode-queries'
import type { FailureModeStatus, FailureModePriority } from '@/services/failure-mode/failure-mode-types'

const STATUSES: { label: string; value: FailureModeStatus; color: string }[] = [
  { label: 'Open', value: 'open', color: '#3B82F6' },
  { label: 'In Progress', value: 'in_progress', color: '#F59E0B' },
  { label: 'Resolved', value: 'resolved', color: '#22C55E' },
]

const PRIORITIES: { label: string; value: FailureModePriority; color: string }[] = [
  { label: 'Low', value: 'low', color: '#22C55E' },
  { label: 'Medium', value: 'medium', color: '#EAB308' },
  { label: 'High', value: 'high', color: '#F97316' },
]

function formatDateDisplay(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toISODate(date: Date) {
  return date.toISOString().split('T')[0]
}

export default function EditFailureModeScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { data: fm, isLoading: fmLoading } = useFailureModeById(id)
  const { mutate: updateFm, isPending, error: apiError } = useUpdateFailureMode()

  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<FailureModeStatus>('open')
  const [priority, setPriority] = useState<FailureModePriority>('medium')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [resolutions, setResolutions] = useState<string[]>([])
  const [resolutionInput, setResolutionInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (fm && !initialized) {
      setTitle(fm.title ?? '')
      setStatus(fm.status ?? 'open')
      setPriority(fm.priority ?? 'medium')
      setResolutions(fm.resolutions ?? [])
      if (fm.due_date) setDueDate(new Date(fm.due_date))
      setInitialized(true)
    }
  }, [fm, initialized])

  function addResolution() {
    const trimmed = resolutionInput.trim()
    if (!trimmed) return
    setResolutions((prev) => [...prev, trimmed])
    setResolutionInput('')
  }

  function removeResolution(index: number) {
    setResolutions((prev) => prev.filter((_, i) => i !== index))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!id || !validate()) return
    updateFm(
      {
        failureModeId: id,
        title: title.trim(),
        status,
        priority,
        resolutions,
        due_date: dueDate ? toISODate(dueDate) : null,
      },
      { onSuccess: () => router.back() },
    )
  }

  const apiErrorMsg = (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  if (fmLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Edit Failure Mode</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70"
        >
          <Text className="text-sm font-semibold text-white">{isPending ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {apiErrorMsg && (
          <View className="rounded-xl bg-red-50 border border-red-200 p-3">
            <Text className="text-sm text-red-600">{apiErrorMsg}</Text>
          </View>
        )}

        {/* Equipment (locked) */}
        {fm?.equipment && (
          <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <Text className="text-xs text-gray-400 mb-0.5">Equipment</Text>
            <Text className="text-sm font-medium text-gray-700">{fm.equipment.name}</Text>
          </View>
        )}

        {/* Title */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: '' })) }}
            placeholder="Describe the failure"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
          />
          {!!errors.title && <Text className="text-xs text-red-500 mt-1">{errors.title}</Text>}
        </View>

        {/* Status */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Status</Text>
          <View className="flex-row gap-x-2">
            {STATUSES.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => setStatus(s.value)}
                className={`flex-1 h-10 rounded-xl border items-center justify-center ${
                  status === s.value ? 'border-transparent' : 'border-gray-200 bg-white'
                }`}
                style={status === s.value ? { backgroundColor: s.color } : undefined}
              >
                <Text className={`text-xs font-semibold ${status === s.value ? 'text-white' : 'text-gray-600'}`}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Priority</Text>
          <View className="flex-row gap-x-2">
            {PRIORITIES.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setPriority(p.value)}
                className={`flex-1 h-10 rounded-xl border items-center justify-center ${
                  priority === p.value ? 'border-transparent' : 'border-gray-200 bg-white'
                }`}
                style={priority === p.value ? { backgroundColor: p.color } : undefined}
              >
                <Text className={`text-xs font-semibold ${priority === p.value ? 'text-white' : 'text-gray-600'}`}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Due Date</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 flex-row items-center justify-between"
          >
            <Text className={`text-sm ${dueDate ? 'text-gray-800' : 'text-gray-400'}`}>
              {dueDate ? formatDateDisplay(dueDate) : 'Select date (optional)'}
            </Text>
            <View className="flex-row items-center gap-x-2">
              {dueDate && (
                <Pressable
                  onPress={() => setDueDate(null)}
                  hitSlop={8}
                  onStartShouldSetResponder={() => true}
                >
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </Pressable>
              )}
              <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selected) => {
                setShowDatePicker(Platform.OS === 'ios')
                if (selected) setDueDate(selected)
              }}
            />
          )}
        </View>

        {/* Resolutions */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Resolutions</Text>
          <View className="flex-row gap-x-2">
            <TextInput
              value={resolutionInput}
              onChangeText={setResolutionInput}
              onSubmitEditing={addResolution}
              placeholder="Add a resolution step…"
              returnKeyType="done"
              className="flex-1 h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
            <Pressable
              onPress={addResolution}
              className="h-11 px-4 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
            >
              <Text className="text-sm font-semibold text-white">Add</Text>
            </Pressable>
          </View>
          {resolutions.length > 0 && (
            <View className="mt-2 gap-y-2">
              {resolutions.map((r, i) => (
                <View key={i} className="flex-row items-center bg-white rounded-xl border border-gray-100 px-3 py-2.5 gap-x-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <Text className="flex-1 text-sm text-gray-700">{r}</Text>
                  <Pressable onPress={() => removeResolution(i)} hitSlop={8} className="active:opacity-60">
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
