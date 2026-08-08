import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useJobAidById, useUpdateJobAid } from '@/services/job-aids/job-aids-queries'
import { useEquipment } from '@/services/equipment/equipment-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import { FileManagerSheet } from '@/components/ui/file-manager-sheet'
import type { JobAidCategory, JobAidStatus } from '@/services/job-aids/job-aids-types'

const CATEGORIES: JobAidCategory[] = ['Maintenance', 'Safety', 'Operations']
const CATEGORY_ITEMS = CATEGORIES.map((c) => ({ label: c, value: c }))

const STATUS_BADGE_STYLE: Record<JobAidStatus, { bg: string; dot: string; text: string; label: string }> = {
  draft: { bg: 'bg-amber-100', dot: 'bg-amber-400', text: 'text-amber-700', label: 'Draft' },
  pending_approval: { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-700', label: 'Pending Approval' },
  published: { bg: 'bg-green-100', dot: 'bg-green-500', text: 'text-green-700', label: 'Published' },
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text className="text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <Text className="text-red-500"> *</Text>}
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
  required,
  error,
}: {
  label: string
  value: string
  placeholder: string
  onPress: () => void
  required?: boolean
  error?: string
}) {
  return (
    <View>
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={onPress}
        className={`h-12 rounded-xl border px-4 flex-row items-center justify-between ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
        }`}
      >
        <Text className={`text-sm ${value ? 'text-gray-800' : 'text-gray-400'}`} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
      </Pressable>
      <FieldError message={error} />
    </View>
  )
}

export default function EditJobAidScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading } = useJobAidById(id)
  const { mutate: updateJobAid, isPending, error: apiError } = useUpdateJobAid()

  const [image, setImage] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<JobAidCategory | ''>('')
  const [instruction, setInstruction] = useState('')
  const [duration, setDuration] = useState('')
  // Display-only: status changes go through the approval workflow on the detail screen.
  const [status, setStatus] = useState<JobAidStatus>('draft')
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])
  const [selectedEquipmentNames, setSelectedEquipmentNames] = useState<string[]>([])
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const [picker, setPicker] = useState<'category' | 'equipment' | 'image' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment(
    equipmentSearch ? { search: equipmentSearch } : undefined,
  )
  const equipmentItems = (equipmentData?.data ?? []).map((e) => ({
    label: e.name,
    value: e.id,
  }))

  useEffect(() => {
    if (data?.data && !hydrated) {
      const ja = data.data
      setImage(ja.image ?? '')
      setTitle(ja.title)
      setCategory(ja.category ?? '')
      setInstruction(ja.instruction)
      setDuration(ja.estimated_duration != null ? String(ja.estimated_duration) : '')
      setStatus(ja.status)
      setSelectedEquipmentIds(ja.assignedEquipments.map((e) => e.id))
      setSelectedEquipmentNames(ja.assignedEquipments.map((e) => e.name))
      setHydrated(true)
    }
  }, [data, hydrated])

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!category) e.category = 'Category is required'
    if (!instruction.trim()) e.instruction = 'Instructions are required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    updateJobAid(
      {
        id,
        title: title.trim(),
        category: category as JobAidCategory,
        instruction: instruction.trim(),
        image: image || undefined,
        estimated_duration: duration ? Number(duration) : undefined,
        equipment_ids: selectedEquipmentIds,
      },
      { onSuccess: () => router.back() },
    )
  }

  function removeEquipment(eqId: string) {
    const idx = selectedEquipmentIds.indexOf(eqId)
    setSelectedEquipmentIds((prev) => prev.filter((_, i) => i !== idx))
    setSelectedEquipmentNames((prev) => prev.filter((_, i) => i !== idx))
  }

  const apiErrorMsg =
    (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  if (isLoading || !hydrated) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Edit Job Aid</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70"
        >
          <Text className="text-sm font-semibold text-white">
            {isPending ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {apiErrorMsg && (
          <View className="rounded-xl bg-red-50 border border-red-200 p-3">
            <Text className="text-sm text-red-600">{apiErrorMsg}</Text>
          </View>
        )}

        {/* Cover Image */}
        <View>
          <FieldLabel label="Cover Image" />
          <Pressable
            onPress={() => setPicker('image')}
            className="rounded-xl overflow-hidden border border-dashed border-gray-300 bg-white active:opacity-70"
            style={{ aspectRatio: 16 / 9 }}
          >
            {image ? (
              <>
                <Image
                  source={{ uri: image }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                <View className="absolute top-2 right-2 bg-black/50 rounded-lg px-2 py-1">
                  <Text className="text-xs text-white font-medium">Change</Text>
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center gap-y-2">
                <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                <Text className="text-sm text-gray-400">Tap to add cover image</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Title */}
        <View>
          <FieldLabel label="Title" required />
          <TextInput
            value={title}
            onChangeText={(v) => {
              setTitle(v)
              setErrors((e) => ({ ...e, title: '' }))
            }}
            placeholder="Job aid title"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
          />
          <FieldError message={errors.title} />
        </View>

        {/* Category */}
        <PickerField
          label="Category"
          required
          value={category}
          placeholder="Select category"
          onPress={() => setPicker('category')}
          error={errors.category}
        />

        {/* Instructions */}
        <View>
          <FieldLabel label="Instructions" required />
          <TextInput
            value={instruction}
            onChangeText={(v) => {
              setInstruction(v)
              setErrors((e) => ({ ...e, instruction: '' }))
            }}
            placeholder="Describe the instructions for this job aid…"
            multiline
            numberOfLines={4}
            className={`rounded-xl border px-4 py-3 text-sm text-gray-800 bg-white min-h-[100px] ${errors.instruction ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
          <FieldError message={errors.instruction} />
        </View>

        {/* Estimated Duration */}
        <View>
          <FieldLabel label="Estimated Duration" />
          <View className="flex-row items-center gap-x-2">
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="0"
              keyboardType="numeric"
              className="flex-1 h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-white"
              placeholderTextColor="#9CA3AF"
            />
            <View className="h-12 px-4 bg-gray-100 rounded-xl items-center justify-center">
              <Text className="text-sm text-gray-500">min</Text>
            </View>
          </View>
        </View>

        {/* Status (read-only) */}
        <View>
          <FieldLabel label="Status" />
          <View
            className={`self-start flex-row items-center gap-x-1.5 px-3 py-1 rounded-full ${STATUS_BADGE_STYLE[status].bg}`}
          >
            <View className={`w-2 h-2 rounded-full ${STATUS_BADGE_STYLE[status].dot}`} />
            <Text className={`text-xs font-semibold ${STATUS_BADGE_STYLE[status].text}`}>
              {STATUS_BADGE_STYLE[status].label}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 mt-1.5">
            Status changes through Submit for Approval, Approve, and Unpublish on the job aid's detail screen.
          </Text>
        </View>

        {/* Assign Equipment */}
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <FieldLabel label="Assigned Equipment" />
            <Pressable
              onPress={() => {
                setEquipmentSearch('')
                setPicker('equipment')
              }}
              className="active:opacity-60"
            >
              <Text className="text-sm font-semibold text-blue-600">+ Add</Text>
            </Pressable>
          </View>
          {selectedEquipmentNames.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {selectedEquipmentNames.map((name, i) => (
                <View
                  key={selectedEquipmentIds[i]}
                  className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-x-1.5"
                >
                  <Text className="text-xs font-medium text-blue-700">{name}</Text>
                  <Pressable
                    onPress={() => removeEquipment(selectedEquipmentIds[i])}
                    hitSlop={4}
                  >
                    <Ionicons name="close" size={12} color="#1D4ED8" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-gray-400 italic">No equipment assigned</Text>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Pickers */}
      <BottomSheetPicker
        visible={picker === 'category'}
        onClose={() => setPicker(null)}
        title="Select Category"
        items={CATEGORY_ITEMS}
        selected={category}
        onSelect={(v) => {
          setCategory(v as JobAidCategory)
          setErrors((e) => ({ ...e, category: '' }))
          setPicker(null)
        }}
      />

      <BottomSheetPicker
        visible={picker === 'equipment'}
        onClose={() => {
          setPicker(null)
          setEquipmentSearch('')
        }}
        title="Add Equipment"
        items={equipmentItems}
        selected={null}
        searchable
        loading={equipmentLoading}
        onSelect={(eqId) => {
          if (!selectedEquipmentIds.includes(eqId)) {
            const found = equipmentItems.find((e) => e.value === eqId)
            setSelectedEquipmentIds((prev) => [...prev, eqId])
            setSelectedEquipmentNames((prev) => [...prev, found?.label ?? eqId])
          }
          setPicker(null)
        }}
      />

      <FileManagerSheet
        visible={picker === 'image'}
        onClose={() => setPicker(null)}
        onSelect={(url) => {
          setImage(url)
          setPicker(null)
        }}
      />
    </View>
  )
}
