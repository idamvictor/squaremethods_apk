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
import { useJobById, useUpdateJob } from '@/services/jobs/jobs-queries'
import { useTeams, useTeamMembers } from '@/services/teams/teams-queries'
import { useEquipment } from '@/services/equipment/equipment-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import type { JobPriority } from '@/services/jobs/jobs-types'

const PRIORITIES: { label: string; value: JobPriority; color: string }[] = [
  { label: 'Low', value: 'low', color: '#22C55E' },
  { label: 'Medium', value: 'medium', color: '#EAB308' },
  { label: 'High', value: 'high', color: '#F97316' },
  { label: 'Urgent', value: 'urgent', color: '#EF4444' },
]

function formatDateDisplay(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toISODate(date: Date) {
  return date.toISOString().split('T')[0]
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text className="text-sm font-medium text-gray-700 mb-1">
      {label}{required && <Text className="text-red-500"> *</Text>}
    </Text>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <Text className="text-xs text-red-500 mt-1">{message}</Text>
}

function PickerField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
  required,
  error,
}: {
  label: string
  value: string
  placeholder: string
  onPress: () => void
  disabled?: boolean
  required?: boolean
  error?: string
}) {
  return (
    <View>
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`h-12 rounded-xl border px-4 flex-row items-center justify-between ${
          error ? 'border-red-400 bg-red-50' : disabled ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'
        }`}
      >
        <Text className={`text-sm ${value ? 'text-gray-800' : disabled ? 'text-gray-300' : 'text-gray-400'}`} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={disabled ? '#D1D5DB' : '#9CA3AF'} />
      </Pressable>
      <FieldError message={error} />
    </View>
  )
}

export default function EditJobScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { data: job, isLoading: jobLoading } = useJobById(id)
  const { mutate: updateJob, isPending, error: apiError } = useUpdateJob()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<JobPriority>('medium')
  const [teamId, setTeamId] = useState('')
  const [teamName, setTeamName] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [assigneeName, setAssigneeName] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [equipmentName, setEquipmentName] = useState('')
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [safetyNotes, setSafetyNotes] = useState('')
  const [initialized, setInitialized] = useState(false)

  const [picker, setPicker] = useState<'team' | 'assignee' | 'equipment' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: teamsData, isLoading: teamsLoading } = useTeams()
  const { data: membersData, isLoading: membersLoading } = useTeamMembers(teamId || undefined)
  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment()

  // Pre-fill form once job loads
  useEffect(() => {
    if (job && !initialized) {
      setTitle(job.title ?? '')
      setDescription(job.description ?? '')
      setPriority(job.priority ?? 'medium')
      setTeamId(job.team_id ?? '')
      setTeamName(job.team?.name ?? '')
      setAssignedTo(job.assigned_to ?? '')
      setAssigneeName(
        job.assignedUser
          ? `${job.assignedUser.first_name} ${job.assignedUser.last_name}`.trim()
          : '',
      )
      setEquipmentId(job.equipment_id ?? '')
      setEquipmentName(job.equipment?.name ?? '')
      if (job.due_date) setDueDate(new Date(job.due_date))
      setEstimatedDuration(job.estimated_duration ? String(job.estimated_duration) : '')
      setSafetyNotes(job.safety_notes ?? '')
      setInitialized(true)
    }
  }, [job, initialized])

  const teamItems = (teamsData?.data ?? []).map((t) => ({ label: t.name, value: t.id }))
  const memberItems = (membersData?.data ?? []).map((m) => ({
    label: `${m.first_name} ${m.last_name}`,
    value: m.id,
  }))
  const equipmentItems = [
    { label: 'None', value: '' },
    ...(equipmentData?.data ?? []).map((e) => ({ label: e.name, value: e.id })),
  ]

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!teamId) e.team = 'Team is required'
    if (!assignedTo) e.assignedTo = 'Assignee is required'
    if (!estimatedDuration || Number(estimatedDuration) <= 0) e.duration = 'Enter a valid duration'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!id || !validate()) return
    updateJob(
      {
        jobId: id,
        title: title.trim(),
        description: description.trim(),
        priority,
        team_id: teamId,
        assigned_to: assignedTo,
        equipment_id: equipmentId || null,
        due_date: toISODate(dueDate),
        estimated_duration: Number(estimatedDuration),
        safety_notes: safetyNotes.trim(),
      },
      { onSuccess: () => router.back() },
    )
  }

  const apiErrorMsg = (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  if (jobLoading) {
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
          <Text className="text-lg font-bold text-gray-900">Edit Job</Text>
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

        {/* Title */}
        <View>
          <FieldLabel label="Job Title" required />
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: '' })) }}
            placeholder="Enter job title"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
          />
          <FieldError message={errors.title} />
        </View>

        {/* Description */}
        <View>
          <FieldLabel label="Description" />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Job description (optional)"
            multiline
            numberOfLines={3}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 bg-white min-h-[80px]"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        {/* Priority */}
        <View>
          <FieldLabel label="Priority" required />
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
                <Text
                  className={`text-xs font-semibold ${priority === p.value ? 'text-white' : 'text-gray-600'}`}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Team */}
        <PickerField
          label="Team"
          required
          value={teamName}
          placeholder="Select team"
          onPress={() => setPicker('team')}
          error={errors.team}
        />

        {/* Assignee */}
        <PickerField
          label="Assigned To"
          required
          value={assigneeName}
          placeholder={teamId ? 'Select assignee' : 'Select a team first'}
          onPress={() => setPicker('assignee')}
          disabled={!teamId}
          error={errors.assignedTo}
        />

        {/* Equipment */}
        <PickerField
          label="Equipment"
          value={equipmentName}
          placeholder="Select equipment (optional)"
          onPress={() => setPicker('equipment')}
        />

        {/* Due Date */}
        <View>
          <FieldLabel label="Due Date" required />
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 flex-row items-center justify-between"
          >
            <Text className="text-sm text-gray-800">{formatDateDisplay(dueDate)}</Text>
            <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selected) => {
                setShowDatePicker(Platform.OS === 'ios')
                if (selected) setDueDate(selected)
              }}
            />
          )}
        </View>

        {/* Duration */}
        <View>
          <FieldLabel label="Estimated Duration (hours)" required />
          <TextInput
            value={estimatedDuration}
            onChangeText={(v) => { setEstimatedDuration(v); setErrors((e) => ({ ...e, duration: '' })) }}
            placeholder="e.g. 2"
            keyboardType="numeric"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${errors.duration ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
          />
          <FieldError message={errors.duration} />
        </View>

        {/* Safety Notes */}
        <View>
          <FieldLabel label="Safety Notes" />
          <TextInput
            value={safetyNotes}
            onChangeText={setSafetyNotes}
            placeholder="Safety precautions (optional)"
            multiline
            numberOfLines={3}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 bg-white min-h-[80px]"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Bottom sheet pickers */}
      <BottomSheetPicker
        visible={picker === 'team'}
        onClose={() => setPicker(null)}
        title="Select Team"
        items={teamItems}
        selected={teamId}
        loading={teamsLoading}
        onSelect={(value) => {
          const found = teamItems.find((t) => t.value === value)
          setTeamId(value)
          setTeamName(found?.label ?? '')
          if (value !== teamId) {
            setAssignedTo('')
            setAssigneeName('')
          }
          setErrors((e) => ({ ...e, team: '' }))
        }}
      />

      <BottomSheetPicker
        visible={picker === 'assignee'}
        onClose={() => setPicker(null)}
        title="Select Assignee"
        items={memberItems}
        selected={assignedTo}
        loading={membersLoading}
        onSelect={(value) => {
          const found = memberItems.find((m) => m.value === value)
          setAssignedTo(value)
          setAssigneeName(found?.label ?? '')
          setErrors((e) => ({ ...e, assignedTo: '' }))
        }}
      />

      <BottomSheetPicker
        visible={picker === 'equipment'}
        onClose={() => setPicker(null)}
        title="Select Equipment"
        items={equipmentItems}
        selected={equipmentId}
        searchable
        loading={equipmentLoading}
        onSelect={(value) => {
          const found = equipmentItems.find((e) => e.value === value)
          setEquipmentId(value)
          setEquipmentName(value ? (found?.label ?? '') : '')
        }}
      />
    </KeyboardAvoidingView>
  )
}
