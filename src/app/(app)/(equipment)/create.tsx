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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useCreateEquipment } from '@/services/equipment/equipment-queries'
import { useEquipmentTypes } from '@/services/equipment-types/equipment-types-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import { LocationTreePicker } from '@/components/ui/location-tree-picker'
import type { EquipmentStatus } from '@/services/equipment/equipment-types'

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
          error
            ? 'border-red-400 bg-red-50'
            : disabled
              ? 'border-gray-100 bg-gray-50'
              : 'border-gray-200 bg-white'
        }`}
      >
        <Text
          className={`text-sm ${value ? 'text-gray-800' : disabled ? 'text-gray-300' : 'text-gray-400'}`}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={disabled ? '#D1D5DB' : '#9CA3AF'} />
      </Pressable>
      <FieldError message={error} />
    </View>
  )
}

export default function CreateEquipmentScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    prefill_location_id?: string
    prefill_location_name?: string
  }>()
  const { mutate: createEquipment, isPending, error: apiError } = useCreateEquipment()

  const [typeId, setTypeId] = useState('')
  const [typeName, setTypeName] = useState('')
  const [locationId, setLocationId] = useState(params.prefill_location_id ?? '')
  const [locationName, setLocationName] = useState(params.prefill_location_name ?? '')
  const [name, setName] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('draft')
  const [notes, setNotes] = useState('')

  const [picker, setPicker] = useState<'type' | 'location' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: typesData, isLoading: typesLoading } = useEquipmentTypes()

  const typeItems = (typesData?.data ?? []).map((t) => ({ label: t.name, value: t.id }))

  function validate() {
    const e: Record<string, string> = {}
    if (!typeId) e.type = 'Equipment type is required'
    if (!locationId) e.location = 'Location is required'
    if (!name.trim()) e.name = 'Name is required'
    if (!referenceCode.trim()) e.referenceCode = 'Reference code is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    createEquipment(
      {
        equipment_type_id: typeId,
        location_id: locationId,
        name: name.trim(),
        reference_code: referenceCode.trim(),
        notes: notes.trim(),
        status,
      },
      { onSuccess: () => router.back() },
    )
  }

  const apiErrorMsg =
    (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

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
          <Text className="text-lg font-bold text-gray-900">New Equipment</Text>
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

        {/* Equipment Type */}
        <PickerField
          label="Equipment Type"
          required
          value={typeName}
          placeholder="Select equipment type"
          onPress={() => setPicker('type')}
          error={errors.type}
        />

        {/* Location */}
        <PickerField
          label="Location"
          required
          value={locationName}
          placeholder="Select location"
          onPress={() => setPicker('location')}
          error={errors.location}
        />

        {/* Name */}
        <View>
          <FieldLabel label="Name" required />
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })) }}
            placeholder="Equipment name"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
          />
          <FieldError message={errors.name} />
        </View>

        {/* Reference Code */}
        <View>
          <FieldLabel label="Reference Code" required />
          <TextInput
            value={referenceCode}
            onChangeText={(v) => { setReferenceCode(v); setErrors((e) => ({ ...e, referenceCode: '' })) }}
            placeholder="e.g. EQ-001"
            autoCapitalize="characters"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${errors.referenceCode ? 'border-red-400' : 'border-gray-200'}`}
            placeholderTextColor="#9CA3AF"
          />
          <FieldError message={errors.referenceCode} />
        </View>

        {/* Status */}
        <View>
          <FieldLabel label="Status" required />
          <View className="flex-row gap-x-2">
            {(['draft', 'published'] as EquipmentStatus[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                className={`flex-1 h-10 rounded-xl border items-center justify-center ${
                  status === s ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'
                }`}
              >
                <Text
                  className={`text-xs font-semibold capitalize ${status === s ? 'text-white' : 'text-gray-600'}`}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View>
          <FieldLabel label="Notes" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes (optional)"
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
        visible={picker === 'type'}
        onClose={() => setPicker(null)}
        title="Select Equipment Type"
        items={typeItems}
        selected={typeId}
        searchable
        loading={typesLoading}
        onSelect={(value) => {
          const found = typeItems.find((t) => t.value === value)
          setTypeId(value)
          setTypeName(found?.label ?? '')
          setErrors((e) => ({ ...e, type: '' }))
        }}
      />

      <LocationTreePicker
        visible={picker === 'location'}
        onClose={() => setPicker(null)}
        selected={locationId}
        onSelect={(id, name) => {
          setLocationId(id)
          setLocationName(name)
          setErrors((e) => ({ ...e, location: '' }))
        }}
      />
    </KeyboardAvoidingView>
  )
}
