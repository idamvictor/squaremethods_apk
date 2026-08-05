import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAuthStore } from '@/store/auth-store'
import { useCreateFailureMode } from '@/services/failure-mode/failure-mode-queries'
import { useEquipment } from '@/services/equipment/equipment-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import { FileManagerSheet } from '@/components/ui/file-manager-sheet'
import type { ContributionType } from '@/services/failure-mode/failure-mode-types'

const CONTRIBUTION_TYPES: ContributionType[] = [
  'Problem Solved',
  'Improvement',
  'Best Practice',
  'Lesson Learned',
  'Troubleshooting Tip',
  'Safety Observation',
  'PM Optimization',
]
const CONTRIBUTION_TYPE_ITEMS = CONTRIBUTION_TYPES.map((c) => ({ label: c, value: c }))

function formatDateDisplay(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toISODate(date: Date) {
  return date.toISOString().split('T')[0]
}

export default function CreateFailureModeScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const { mutate: createFm, isPending, error: apiError } = useCreateFailureMode()

  const [image, setImage] = useState('')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [title, setTitle] = useState('')
  const [contributionType, setContributionType] = useState<ContributionType>('Problem Solved')
  const [equipmentId, setEquipmentId] = useState('')
  const [equipmentName, setEquipmentName] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [resolutions, setResolutions] = useState<string[]>([])
  const [resolutionInput, setResolutionInput] = useState('')
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment()
  const equipmentItems = (equipmentData?.data ?? []).map((e) => ({ label: e.name, value: e.id }))

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
    if (!equipmentId) e.equipment = 'Equipment is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate() || !user) return
    createFm(
      {
        title: title.trim(),
        priority: contributionType,
        equipment_id: equipmentId,
        reported_by: user.id,
        resolutions,
        due_date: dueDate ? toISODate(dueDate) : null,
        image: image || undefined,
      },
      { onSuccess: () => router.back() },
    )
  }

  const apiErrorMsg = (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

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
          <Text className="text-lg font-bold text-gray-900">Add New Contribution</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70"
        >
          <Text className="text-sm font-semibold text-white">{isPending ? 'Creating…' : 'Contribute'}</Text>
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

        {/* Image */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Image (optional)</Text>
          <Pressable
            onPress={() => setShowImagePicker(true)}
            className="rounded-xl overflow-hidden border border-dashed border-gray-300 bg-white active:opacity-70"
            style={{ aspectRatio: 16 / 9 }}
          >
            {image ? (
              <>
                <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <View className="absolute top-2 right-2 bg-black/50 rounded-lg px-2 py-1">
                  <Text className="text-xs text-white font-medium">Change</Text>
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center gap-y-2">
                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                <Text className="text-sm text-gray-400">Tap to add image</Text>
              </View>
            )}
          </Pressable>
          {image ? (
            <Pressable onPress={() => setImage('')} className="mt-1 active:opacity-60">
              <Text className="text-xs text-red-500">Remove image</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Title */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Contribution Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: '' })) }}
            placeholder="Enter contribution title"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
          />
          {!!errors.title && <Text className="text-xs text-red-500 mt-1">{errors.title}</Text>}
        </View>

        {/* Contribution Type */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Contribution Type</Text>
          <Pressable
            onPress={() => setShowTypePicker(true)}
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 flex-row items-center justify-between"
          >
            <Text className="text-sm text-gray-800">{contributionType}</Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Equipment */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Attached Equipment <Text className="text-red-500">*</Text>
          </Text>
          <Pressable
            onPress={() => setShowEquipmentPicker(true)}
            className={`h-12 rounded-xl border px-4 flex-row items-center justify-between ${
              errors.equipment ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`text-sm ${equipmentName ? 'text-gray-800' : 'text-gray-400'}`} numberOfLines={1}>
              {equipmentName || 'Select equipment'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </Pressable>
          {!!errors.equipment && <Text className="text-xs text-red-500 mt-1">{errors.equipment}</Text>}
        </View>

        {/* Contributed By */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Contributed By</Text>
          <View className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 justify-center">
            <Text className="text-sm text-gray-700 font-medium">
              {user ? `${user.first_name} ${user.last_name}` : 'Loading…'}
            </Text>
          </View>
        </View>

        {/* Date */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Date</Text>
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
              minimumDate={new Date()}
              onChange={(_, selected) => {
                setShowDatePicker(Platform.OS === 'ios')
                if (selected) setDueDate(selected)
              }}
            />
          )}
        </View>

        {/* Key Points */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Key Points</Text>
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

      <BottomSheetPicker
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="Select Contribution Type"
        items={CONTRIBUTION_TYPE_ITEMS}
        selected={contributionType}
        onSelect={(value) => {
          setContributionType(value as ContributionType)
          setShowTypePicker(false)
        }}
      />
      <BottomSheetPicker
        visible={showEquipmentPicker}
        onClose={() => setShowEquipmentPicker(false)}
        title="Select Equipment"
        items={equipmentItems}
        selected={equipmentId}
        searchable
        loading={equipmentLoading}
        onSelect={(value) => {
          const found = equipmentItems.find((e) => e.value === value)
          setEquipmentId(value)
          setEquipmentName(found?.label ?? '')
          setErrors((e) => ({ ...e, equipment: '' }))
        }}
      />
      <FileManagerSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={(url) => { setImage(url); setShowImagePicker(false) }}
      />
    </KeyboardAvoidingView>
  )
}
