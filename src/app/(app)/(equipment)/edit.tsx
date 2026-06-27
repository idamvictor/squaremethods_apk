import { useEffect, useRef, useState } from 'react'
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
import { useEquipmentById, useUpdateEquipment } from '@/services/equipment/equipment-queries'
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <FieldLabel label={label} />
      <View className="h-12 rounded-xl border border-gray-100 px-4 bg-gray-50 justify-center">
        <Text className="text-sm text-gray-400" numberOfLines={1}>
          {value || '—'}
        </Text>
      </View>
    </View>
  )
}

export default function EditEquipmentScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const { data: equipmentData, isLoading } = useEquipmentById(id)
  const { mutate: updateEquipment, isPending, error: apiError } = useUpdateEquipment()

  const [name, setName] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('draft')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const initialized = useRef(false)

  useEffect(() => {
    if (equipmentData?.data && !initialized.current) {
      initialized.current = true
      setName(equipmentData.data.name)
      setStatus(equipmentData.data.status)
      setNotes(equipmentData.data.notes ?? '')
    }
  }, [equipmentData])

  const equipment = equipmentData?.data
  const apiErrorMsg =
    (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!id || !validate()) return
    updateEquipment(
      { id, data: { name: name.trim(), status, notes: notes.trim() } },
      { onSuccess: () => router.back() },
    )
  }

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-gray-50 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
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
          <Text className="text-lg font-bold text-gray-900">Edit Equipment</Text>
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

        {/* Read-only fields */}
        <ReadOnlyField label="Equipment Type" value={equipment?.equipmentType?.name ?? ''} />
        <ReadOnlyField label="Reference Code" value={equipment?.reference_code ?? ''} />
        <ReadOnlyField label="Location" value={equipment?.location?.name ?? ''} />

        {/* Editable: Name */}
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

        {/* Editable: Status */}
        <View>
          <FieldLabel label="Status" />
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

        {/* Editable: Notes */}
        <View>
          <FieldLabel label="Notes" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes (optional)"
            multiline
            numberOfLines={4}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 bg-white min-h-[80px]"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
